import { useAppStore } from "../store/useAppStore";
import { useEffect, useMemo } from "react";
import { dateRangeIncludes } from "../lib/calendar";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function todayKey() { return new Date().toDateString(); }
function weekdayKey() { return WEEKDAYS[new Date().getDay()]; }

export function useTasks() {
  const store = useAppStore();

  // Initialize auth when hook mounts
  useEffect(() => {
    if (!store.user && !store.isLoaded) {
      store.initAuth();
    }
  }, [store.user, store.isLoaded, store.initAuth]);

  // Map unified tasks back to legacy structure
  const data = useMemo(() => {
    const d = {
      weeklySchedule: { sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [] },
      flexibleTemplates: store.templates || [],
      dailyChecklist: { date: todayKey(), items: [] },
      history: store.user?.history || {}
    };

    if (store.tasks) {
      store.tasks.forEach(t => {
        if (t.type === "weekly_recurring" && t.day_of_week) {
          d.weeklySchedule[t.day_of_week].push(t);
        } else if (t.type === "instance" && t.date === todayKey()) {
          // Map is_focus back to pinned for legacy UI
          d.dailyChecklist.items.push({ ...t, pinned: t.is_focus });
        }
      });
    }

    // Sort by order
    for (const day of WEEKDAYS) {
      d.weeklySchedule[day].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // Inject Calendar Events for today
    if (store.calendarEvents) {
      store.calendarEvents.forEach(event => {
        if (dateRangeIncludes(event)) {
          d.dailyChecklist.items.push({
            ...event,
            id: `calendar-${event.id}-${todayKey()}`,
            type: "calendar_event",
            completed: false, // Calendar events aren't typically checked off, but we can allow it in UI if needed
            is_focus: false,
            pinned: false,
            source: "calendar"
          });
        }
      });
    }

    d.dailyChecklist.items.sort((a, b) => (a.order || 0) - (b.order || 0));
    d.flexibleTemplates.sort((a, b) => (a.order || 0) - (b.order || 0));

    return d;
  }, [store.tasks, store.templates, store.user, store.calendarEvents]);

  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    const todayEntry = data.history?.[todayKey()];
    if (!todayEntry?.allCompleted) d.setDate(d.getDate() - 1);
    while (true) {
      const key = d.toDateString();
      const entry = data.history?.[key];
      if (entry?.allCompleted) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  }, [data.history]);

  return {
    data,
    categories: store.categories || [],
    todayItems: data.dailyChecklist.items,
    todayWeekday: weekdayKey(),
    streak,
    toggleTask: store.toggleTask,
    pinTask: store.toggleFocus, // Map pinTask to toggleFocus
    addFlexibleToToday: store.addFlexibleToToday,
    removeFlexibleFromToday: store.removeFlexibleFromToday,
    toggleTemplateInToday: (templateId) => {
      const existing = data.dailyChecklist.items.find((it) => it.templateId === templateId);
      if (existing) {
        if (!existing.completed) store.removeFlexibleFromToday(existing.id);
      } else {
        store.addFlexibleToToday(templateId);
      }
    },
    addAllTemplates: () => {
      // Missing logic in store, let's implement here for now by calling addFlexibleToToday
      const existing = new Set(data.dailyChecklist.items.filter((i) => i.templateId).map((i) => i.templateId));
      data.flexibleTemplates.filter(t => !existing.has(t.id)).forEach(t => store.addFlexibleToToday(t.id));
    },
    reorderToday: store.reorderToday,
    addWeeklyTask: store.addWeeklyTask,
    updateWeeklyTask: store.updateWeeklyTask,
    deleteWeeklyTask: store.deleteWeeklyTask,
    reorderWeekly: store.reorderWeekly,
    addTemplate: store.addTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    reorderTemplates: store.reorderTemplates,
    importData: () => {} // Deprecated, handled by MigrationService
  };
}
