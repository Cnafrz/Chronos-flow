import { db, serverTimestamp } from "../db/firebase.js";
import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";

export class TaskService {
  static subscribeToCollection(collectionName, uid, callback) {
    const q = query(collection(db, collectionName), where("owner_id", "==", uid));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
    });
  }

  static async saveDocument(collectionName, item) {
    try {
      await setDoc(doc(db, collectionName, item.id), {
        ...item,
        createdAt: item.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: item.owner_id
      }, { merge: true });
    } catch (error) {
      console.error(`Error saving ${collectionName}:`, error);
      toast.error("Could not save your changes");
    }
  }

  static async deleteDocument(collectionName, id) {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
      toast.error("Could not delete this item");
    }
  }
  /**
   * Subscribe to a user's tasks. Triggers callback on any change (cache or server).
   */
  static subscribeToTasks(uid, callback) {
    const q = query(collection(db, "tasks"), where("owner_id", "==", uid));
    
    // onSnapshot automatically returns local cache first, then syncs with server.
    return onSnapshot(q, (snapshot) => {
      const tasks = [];
      snapshot.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));
      callback(tasks);
    }, (error) => {
      console.error("Error subscribing to tasks:", error);
      toast.error("Failed to load tasks");
    });
  }

  static subscribeToTemplates(uid, callback) {
    const q = query(collection(db, "templates"), where("owner_id", "==", uid));
    return onSnapshot(q, (snapshot) => {
      const templates = [];
      snapshot.forEach((doc) => templates.push({ id: doc.id, ...doc.data() }));
      callback(templates);
    }, (error) => {
      console.error("Error subscribing to templates:", error);
    });
  }

  static subscribeToCategories(uid, callback) {
    const q = query(collection(db, "categories"), where("owner_id", "==", uid), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot) => {
      const categories = [];
      snapshot.forEach((doc) => categories.push({ id: doc.id, ...doc.data() }));
      callback(categories);
    }, (error) => {
      console.error("Error subscribing to categories:", error);
    });
  }

  /**
   * Syncs a single task to Firestore. Works offline natively.
   */
  static async saveTask(task) {
    try {
      const taskRef = doc(db, "tasks", task.id);
      await setDoc(taskRef, {
        ...task,
        createdAt: task.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: task.owner_id
      }, { merge: true });
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  }

  static async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await setDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  }

  static async deleteTask(taskId) {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  }

  // ---- Categories ----
  static async saveCategory(category) {
    try {
      const catRef = doc(db, "categories", category.id);
      await setDoc(catRef, {
        ...category,
        createdAt: category.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: category.owner_id
      }, { merge: true });
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  }

  static async updateCategory(categoryId, updates) {
    try {
      const catRef = doc(db, "categories", categoryId);
      await updateDoc(catRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  }

  static async deleteCategory(categoryId) {
    try {
      const catRef = doc(db, "categories", categoryId);
      await deleteDoc(catRef);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  }

  // ---- Templates ----
  static async saveTemplate(template) {
    try {
      const tplRef = doc(db, "templates", template.id);
      await setDoc(tplRef, {
        ...template,
        createdAt: template.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: template.owner_id
      }, { merge: true });
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  }

  static async updateTemplate(templateId, updates) {
    try {
      const tplRef = doc(db, "templates", templateId);
      await updateDoc(tplRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    }
  }

  static async deleteTemplate(templateId) {
    try {
      const tplRef = doc(db, "templates", templateId);
      await deleteDoc(tplRef);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  }
}
