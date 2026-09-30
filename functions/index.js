const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const moment = require("moment-timezone");

admin.initializeApp();
const db = getFirestore();
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

exports.generateDailyTasks = onSchedule("every 4 hours", async (event) => {
  const usersSnap = await db.collection("users").get();

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const uid = userDoc.id;
    const tz = userData.timeZone || "UTC";

    // Generate for today and tomorrow to ensure tasks are ready before midnight
    const datesToGenerate = [
      moment().tz(tz),
      moment().tz(tz).add(1, 'day')
    ];

    for (const mDate of datesToGenerate) {
      const dayOfWeek = WEEKDAYS[mDate.day()];
      const dateKey = mDate.format("YYYY-MM-DD");
      const dateString = mDate.toDate().toDateString(); // "Mon Sep 14 2026"

      // Fetch weekly recurring tasks for this user for this day of week
      const weeklyTasksSnap = await db.collection("tasks")
        .where("owner_id", "==", uid)
        .where("type", "==", "weekly_recurring")
        .where("day_of_week", "==", dayOfWeek)
        .get();

      if (weeklyTasksSnap.empty) continue;

      // Get existing instances for this date to avoid duplicates
      const existingInstancesSnap = await db.collection("tasks")
        .where("owner_id", "==", uid)
        .where("type", "==", "instance")
        .where("date", "==", dateString)
        .get();

      const existingIds = new Set(existingInstancesSnap.docs.map(doc => doc.id));

      const batch = db.batch();
      let hasWrites = false;

      for (const taskDoc of weeklyTasksSnap.docs) {
        const instanceId = `${taskDoc.id}_${dateKey}`;
        
        if (!existingIds.has(instanceId)) {
          const instanceRef = db.collection("tasks").doc(instanceId);
          batch.set(instanceRef, {
            owner_id: taskDoc.data().owner_id,
            title: taskDoc.data().title,
            type: "instance",
            date: dateString,
            category: taskDoc.data().category || null,
            duration: taskDoc.data().duration || null,
            startTime: taskDoc.data().startTime || null,
            endTime: taskDoc.data().endTime || null,
            completed: false,
            is_focus: false,
            order: taskDoc.data().order || 0,
            visibility: taskDoc.data().visibility || "private",
            weeklyTaskId: taskDoc.id,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
          hasWrites = true;
        }
      }

      if (hasWrites) {
        await batch.commit();
      }
    }
  }
});
