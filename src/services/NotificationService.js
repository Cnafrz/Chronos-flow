import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  static async requestPermissions() {
    if (Capacitor.isNativePlatform() || "Notification" in window) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch (e) {
        console.error("Error requesting notification permissions", e);
        return false;
      }
    }
    return false;
  }

  static async scheduleTaskReminders(tasks, defaultReminderMinutes = 30) {
    if (!(await this.requestPermissions())) return;

    // Clear existing notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const notificationsToSchedule = [];
    let idCounter = 1;

    const now = new Date();
    const todayStr = now.toDateString();

    tasks.forEach(task => {
      // Only schedule for today's tasks that aren't completed and have a start time
      if (!task.completed && task.startTime && (task.date === todayStr || task.type === 'weekly_recurring')) {
        const [hours, minutes] = task.startTime.split(':').map(Number);
        
        const taskDate = new Date();
        taskDate.setHours(hours, minutes, 0, 0);

        // Calculate reminder time
        const reminderTime = new Date(taskDate.getTime() - (defaultReminderMinutes * 60 * 1000));

        if (reminderTime > now) {
          notificationsToSchedule.push({
            id: idCounter++,
            title: `Upcoming: ${task.title}`,
            body: `Starts at ${task.startTime}`,
            schedule: { at: reminderTime },
            actionTypeId: "",
            extra: null
          });
        }
      }
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule
      });
    }
  }

  static async notifyPartnerProgress(task) {
    if (!(await this.requestPermissions())) return;

    await LocalNotifications.schedule({
      notifications: [{
        id: 100000 + (Date.now() % 1000000000),
        title: "Partner progress",
        body: `Your partner completed: ${task.title}`,
        schedule: { at: new Date(Date.now() + 1000) },
        actionTypeId: "",
        extra: { taskId: task.id }
      }]
    });
  }
}
