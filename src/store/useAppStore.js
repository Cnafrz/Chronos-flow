import { create } from "zustand";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../db/firebase.js";
import { TaskService } from "../services/TaskService";
import { AuthService } from "../services/AuthService";
import { PartnerService } from "../services/PartnerService";
import { dateKey, dateRangeIncludes } from "../lib/calendar";

function uid() {
  return crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function todayKey() {
  return new Date().toDateString();
}

function todayWeekday() {
  return WEEKDAYS[new Date().getDay()];
}



export const useAppStore = create((set, get) => ({
  user: null,
  userProfile: null,
  tasks: [],
  templates: [],
  categories: [],
  calendarEvents: [],
  goals: [],
  notebooks: [],
  notes: [],
  partnerProfile: null,
  partnerTasks: [],
  partnerId: null,
  partnerTasksLoaded: false,
  _partnerUnsubs: [],
  isLoaded: false,
  _unsubs: [],

  initAuth: () => {
    AuthService.initializeAuth((user) => {
      set({ user });
      if (user) {
        get().subscribeData(user.uid);
      } else {
        get().unsubscribeData();
        set({ tasks: [], templates: [], categories: [], partnerTasks: [], partnerProfile: null, userProfile: null, isLoaded: false });
      }
    });
  },

  hydrateTodayInstances: () => {
    const state = get();
    if (!state.tasks || !state.user) return;
    const today = todayKey();
    const todayDow = todayWeekday();
    
    const weeklyTasksToday = state.tasks.filter(t => t.type === "weekly_recurring" && t.day_of_week === todayDow);
    const existingInstances = new Set(state.tasks.filter(t => t.type === "instance" && t.date === today && t.weeklyTaskId).map(t => t.weeklyTaskId));
    
    const missing = weeklyTasksToday.filter(t => !existingInstances.has(t.id));
    if (missing.length > 0) {
      const newInstances = missing.map(t => {
        const instanceId = `${t.id}_${today.replace(/\s+/g, '_')}`;
        return {
          id: instanceId,
          owner_id: t.owner_id,
          title: t.title,
          type: "instance",
          date: today,
          category: t.category || null,
          duration: t.duration || null,
          startTime: t.startTime || null,
          endTime: t.endTime || null,
          completed: false,
          is_focus: false,
          order: t.order || 0,
          visibility: t.visibility || "private",
          weeklyTaskId: t.id
        };
      });
      // Save directly to Firebase; the subscription will pick it up instantly
      newInstances.forEach(inst => TaskService.saveTask(inst));
    }
  },

  unsubscribeData: () => {
    get().unsubscribePartnerData();
    const unsubs = get()._unsubs;
    unsubs.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    set({ _unsubs: [] });
  },

  unsubscribePartnerData: () => {
    get()._partnerUnsubs.forEach((unsub) => {
      if (typeof unsub === "function") unsub();
    });
    set({ _partnerUnsubs: [], partnerId: null, partnerProfile: null, partnerTasks: [], partnerTasksLoaded: false });
  },

  subscribeData: (uid) => {
    get().unsubscribeData();
    const unsubs = [];

    const unsubTasks = TaskService.subscribeToTasks(uid, (tasks) => {
      set({ tasks: tasks, isLoaded: true });
      get().hydrateTodayInstances();
      import("../services/NotificationService").then(({ NotificationService }) => {
        const userTimezone = get().userProfile?.settings?.timezone;
        NotificationService.scheduleTaskReminders(tasks, 30, userTimezone);
      });
    });
    unsubs.push(unsubTasks);

    const unsubTemplates = TaskService.subscribeToTemplates(uid, (templates) => set({ templates }));
    unsubs.push(unsubTemplates);

    const unsubCategories = TaskService.subscribeToCategories(uid, (categories) => set({ categories }));
    unsubs.push(unsubCategories);

    ["calendarEvents", "goals", "notebooks", "notes"].forEach((collectionName) => {
      unsubs.push(TaskService.subscribeToCollection(collectionName, uid, (items) => {
        set({ [collectionName]: items });
      }));
    });
    
    const unsubProfile = onSnapshot(doc(db, "users", uid), (docSnap) => {
      if (!docSnap.exists()) return;

      const profile = docSnap.data();
      set({ userProfile: profile });
      if (profile.partner_id === get().partnerId) return;

      get().unsubscribePartnerData();
      if (!profile.partner_id) return;

      const unsubPartnerTasks = PartnerService.subscribeToPartnerTasks(
        profile.partner_id,
        (tasks) => {
          const previousTasks = get().partnerTasks;
          const shouldNotify = get().partnerTasksLoaded;
          const newlyCompleted = tasks.filter((task) => task.completed && !previousTasks.find((previousTask) => previousTask.id === task.id)?.completed);
          set({ partnerTasks: tasks, partnerTasksLoaded: true });
          if (shouldNotify) {
            import("../services/NotificationService").then(({ NotificationService }) => {
              newlyCompleted.forEach((task) => NotificationService.notifyPartnerProgress(task));
            });
          }
        }
      );
      const unsubPartnerProfile = PartnerService.subscribeToPartnerProfile(
        profile.partner_id,
        (partnerProfile) => set({ partnerProfile })
      );
      set({ partnerId: profile.partner_id, _partnerUnsubs: [unsubPartnerTasks, unsubPartnerProfile] });
    });
    unsubs.push(unsubProfile);
    
    set({ _unsubs: unsubs });
  },

  togglePartnerReaction: (taskId, emoji) => {
    const { partnerTasks } = get();
    const task = partnerTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Toggle logic: if already reacted with same emoji, remove it. Otherwise add it.
    const currentReaction = task.reaction === emoji ? null : emoji;
    
    // Optimistic update
    set({ partnerTasks: partnerTasks.map(t => t.id === taskId ? { ...t, reaction: currentReaction } : t) });
    
    // Server update
    TaskService.updateTask(taskId, { reaction: currentReaction });
  },

  updateUserProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  updateUserSettings: async (settingsUpdates) => {
    const { user, userProfile } = get();
    if (!user || !userProfile) return;
    await updateDoc(doc(db, "users", user.uid), {
      settings: {
        ...userProfile.settings,
        ...settingsUpdates
      },
      updatedAt: serverTimestamp()
    });
  },



  addCalendarEvent: (event) => {
    const item = { id: uid(), owner_id: get().user?.uid, ...event };
    set({ calendarEvents: [...get().calendarEvents, item] });
    TaskService.saveDocument("calendarEvents", item);
  },
  updateCalendarEvent: (id, updates) => {
    set({ calendarEvents: get().calendarEvents.map((event) => event.id === id ? { ...event, ...updates } : event) });
    TaskService.saveDocument("calendarEvents", { ...get().calendarEvents.find((event) => event.id === id), ...updates });
  },
  deleteCalendarEvent: (id) => {
    set({ calendarEvents: get().calendarEvents.filter((event) => event.id !== id) });
    TaskService.deleteDocument("calendarEvents", id);
  },
  addGoal: (goal) => {
    const item = { id: uid(), owner_id: get().user?.uid, ...goal };
    set({ goals: [...get().goals, item] });
    TaskService.saveDocument("goals", item);
  },
  deleteGoal: (id) => {
    set({ goals: get().goals.filter((goal) => goal.id !== id) });
    TaskService.deleteDocument("goals", id);
  },
  addNotebook: (name) => {
    const item = { id: uid(), owner_id: get().user?.uid, name };
    set({ notebooks: [...get().notebooks, item] });
    TaskService.saveDocument("notebooks", item);
  },
  saveNote: (note) => {
    const item = { id: note.id || uid(), owner_id: get().user?.uid, ...note };
    set({ notes: [...get().notes.filter((current) => current.id !== item.id), item] });
    TaskService.saveDocument("notes", item);
  },
  deleteNote: (id) => {
    set({ notes: get().notes.filter((note) => note.id !== id) });
    TaskService.deleteDocument("notes", id);
  },

  // ---- Category Actions ----
  addCategory: (name, color, icon) => {
    const categories = get().categories;
    const newCategory = {
      id: uid(),
      owner_id: get().user?.uid,
      name,
      color,
      icon,
      order: categories.length,
    };
    set({ categories: [...categories, newCategory] });
    TaskService.saveCategory(newCategory);
  },

  updateCategory: (id, updates) => {
    set({ categories: get().categories.map(c => c.id === id ? { ...c, ...updates } : c) });
    TaskService.updateCategory(id, updates);
  },

  deleteCategory: (id) => {
    set({ categories: get().categories.filter(c => c.id !== id) });
    TaskService.deleteCategory(id);
  },

  reorderCategories: (newOrderItems) => {
    // newOrderItems should be an array of category objects in the new order
    const updated = newOrderItems.map((c, idx) => ({ ...c, order: idx }));
    set({ categories: updated });
    updated.forEach(c => TaskService.updateCategory(c.id, { order: c.order }));
  },

  // ---- Task Actions ----
  toggleTask: (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      // Optimistic update
      set({ tasks: get().tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) });
      // Sync to Firebase
      TaskService.updateTask(id, { completed: !task.completed });
    }
  },

  toggleFocus: (id) => {
    const state = get();
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.is_focus) {
      // Trying to add to focus. Check if there are already 3 active.
      const currentFocusCount = state.tasks.filter(t => t.is_focus && !t.completed).length;
      if (currentFocusCount >= 3) {
        import("react-hot-toast").then(({ toast }) => {
          toast.error("You can only have 3 tasks in Focus at a time.", { id: "focus-limit" });
        });
        return;
      }
    }

    set({ tasks: state.tasks.map(t => t.id === id ? { ...t, is_focus: !t.is_focus } : t) });
    TaskService.updateTask(id, { is_focus: !task.is_focus });
  },

  addFlexibleToToday: (templateId) => {
    const tpl = get().templates.find((t) => t.id === templateId);
    if (!tpl) return;
    
    // Prevent duplicate additions
    const today = new Date().toDateString();
    const existing = get().tasks.find((t) => t.templateId === templateId && t.date === today && t.source === "flexible");
    if (existing) return;
    
    const newTask = {
      id: uid(),
      owner_id: get().user?.uid,
      templateId: tpl.id,
      source: "flexible",
      title: tpl.title,
      type: "instance",
      date: today,
      category: tpl.category || null,
      duration: tpl.duration || null,
      completed: false,
      is_focus: false,
      visibility: "private"
    };

    set({ tasks: [...get().tasks, newTask] });
    TaskService.saveTask(newTask);
  },

  removeFlexibleFromToday: (taskId) => {
    set({ tasks: get().tasks.filter(t => t.id !== taskId) });
    TaskService.deleteTask(taskId);
  },

  addTaskToToday: (title) => {
    const today = new Date().toDateString();
    const newTask = {
      id: uid(),
      owner_id: get().user?.uid,
      source: "quick_capture",
      title: title,
      type: "instance",
      date: today,
      category: null,
      duration: null,
      completed: false,
      is_focus: false,
      visibility: "private"
    };

    set({ tasks: [...get().tasks, newTask] });
    TaskService.saveTask(newTask);
  },

  reorderToday: (newOrderItems) => {
    // Only applies to today's tasks. Update an `order` field on them.
    const updated = newOrderItems.map((t, idx) => ({ ...t, order: idx }));
    // Update local state by merging the ordered items back in
    set({ tasks: get().tasks.map(t => updated.find(u => u.id === t.id) || t) });
    updated.forEach(t => TaskService.updateTask(t.id, { order: t.order }));
  },

  // ---- Template Actions ----
  addTemplate: () => {
    const newTpl = { id: uid(), owner_id: get().user?.uid, title: "New task", category: null, duration: null, visibility: "private" };
    set({ templates: [...get().templates, newTpl] });
    TaskService.saveTemplate(newTpl);
  },

  updateTemplate: (id, patch) => {
    set({ templates: get().templates.map(t => t.id === id ? { ...t, ...patch } : t) });
    TaskService.updateTemplate(id, patch);
  },

  deleteTemplate: (id) => {
    set({ templates: get().templates.filter(t => t.id !== id) });
    TaskService.deleteTemplate(id);
  },

  reorderTemplates: (items) => {
    const updated = items.map((t, idx) => ({ ...t, order: idx }));
    set({ templates: updated });
    updated.forEach(t => TaskService.updateTemplate(t.id, { order: t.order }));
  },

  // ---- Weekly Actions ----
  addWeeklyTask: (day) => {
    const newTask = { id: uid(), owner_id: get().user?.uid, title: "New task", startTime: "09:00", endTime: "10:00", category: null, duration: null, type: "weekly_recurring", day_of_week: day, visibility: "private" };
    set({ tasks: [...get().tasks, newTask] });
    TaskService.saveTask(newTask);
  },

  updateWeeklyTask: (id, patch) => {
    const propagatedFields = ["title", "category", "duration", "startTime", "endTime"];
    const instancePatch = Object.fromEntries(Object.entries(patch).filter(([key]) => propagatedFields.includes(key)));
    set({ tasks: get().tasks.map((task) => {
      if (task.id === id) return { ...task, ...patch };
      if (task.weeklyTaskId === id && task.date === todayKey()) return { ...task, ...instancePatch };
      return task;
    }) });
    TaskService.updateTask(id, patch);
    if (Object.keys(instancePatch).length) {
      get().tasks
        .filter((task) => task.weeklyTaskId === id && task.date === todayKey())
        .forEach((task) => TaskService.updateTask(task.id, instancePatch));
    }
  },

  deleteWeeklyTask: (id) => {
    const relatedInstanceIds = get().tasks.filter((task) => task.weeklyTaskId === id && task.date === todayKey()).map((task) => task.id);
    set({ tasks: get().tasks.filter((task) => task.id !== id && !relatedInstanceIds.includes(task.id)) });
    TaskService.deleteTask(id);
    relatedInstanceIds.forEach((taskId) => TaskService.deleteTask(taskId));
  },

  reorderWeekly: (day, items) => {
    const updated = items.map((t, idx) => ({ ...t, order: idx }));
    set({ tasks: get().tasks.map(t => updated.find(u => u.id === t.id) || t) });
    updated.forEach(t => TaskService.updateTask(t.id, { order: t.order }));
  }
}));
