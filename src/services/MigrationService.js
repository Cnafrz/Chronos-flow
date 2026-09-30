import { db, serverTimestamp } from "../db/firebase.js";
import { collection, writeBatch, doc } from "firebase/firestore";

const STORAGE_KEY = "productivity-data-v2";
const MIGRATION_FLAG = "productivity-data-migrated";

export class MigrationService {
  /**
   * Reads local storage and migrates all data to Firestore under the given UID.
   */
  static async migrateLocalData(uid) {
    if (localStorage.getItem(MIGRATION_FLAG) === "true") {
      return; // Already migrated
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return; // Nothing to migrate

    try {
      const data = JSON.parse(raw);
      const batch = writeBatch(db);

      // Migrate User History & Profile
      const userRef = doc(db, "users", uid);
      batch.set(userRef, {
        history: data.history || {},
        created_at: new Date(),
        updated_at: new Date()
      }, { merge: true });

      // Migrate Weekly Schedule
      if (data.weeklySchedule) {
        for (const [day, tasks] of Object.entries(data.weeklySchedule)) {
          for (const task of tasks) {
            const taskRef = doc(collection(db, "tasks"));
            batch.set(taskRef, {
              ...task,
              owner_id: uid,
              type: "weekly_recurring",
              day_of_week: day,
              visibility: "private",
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
          }
        }
      }

      // Migrate Flexible Templates
      if (data.flexibleTemplates) {
        for (const tpl of data.flexibleTemplates) {
          const tplRef = doc(collection(db, "templates"));
          batch.set(tplRef, {
            ...tpl,
            owner_id: uid,
            visibility: "private",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }
      }

      // Migrate Today's Checklist
      if (data.dailyChecklist && data.dailyChecklist.items) {
        for (const item of data.dailyChecklist.items) {
          const itemRef = doc(collection(db, "tasks"));
          batch.set(itemRef, {
            ...item,
            owner_id: uid,
            type: "instance",
            date: data.dailyChecklist.date,
            visibility: "private",
            is_focus: item.pinned || false,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }
      }

      // Commit all local data to Firestore
      await batch.commit();
      
      // Mark as migrated
      localStorage.setItem(MIGRATION_FLAG, "true");
      console.log("Local data successfully migrated to Firestore.");

    } catch (e) {
      console.error("Migration failed:", e);
    }
  }
}
