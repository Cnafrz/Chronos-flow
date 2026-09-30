/**
 * NotificationService
 *
 * Platform matrix:
 *  - Native (iOS/Android via Capacitor): LocalNotifications with deep-link extra payload
 *  - Web (browser): Web Notifications API + Service Worker for background push
 *  - Desktop (Electron): window.electronApp.showNotification IPC bridge
 *
 * All scheduling is timezone-aware using the user's timezone from their profile.
 */

import { Capacitor } from "@capacitor/core";

// ─────────────────────────────────────────────────────────────
// Platform detection helpers
// ─────────────────────────────────────────────────────────────
const isNative = () => Capacitor.isNativePlatform();
const isElectron = () => typeof window !== "undefined" && !!window.electronApp?.showNotification;
const isWeb = () => !isNative() && !isElectron() && typeof window !== "undefined" && "Notification" in window;

// ─────────────────────────────────────────────────────────────
// Service Worker registration (Web only)
// Registers sw.js from /public for background push support.
// ─────────────────────────────────────────────────────────────
let swRegistration = null;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    // Listen for NAVIGATE messages sent by the SW on notification click
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "NAVIGATE" && event.data.route) {
        window.location.hash = event.data.route;
      }
    });
    return swRegistration;
  } catch (err) {
    console.warn("[NotificationService] SW registration failed:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch {
      return false;
    }
  }

  if (isWeb() || isElectron()) {
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  return false;
}

/** Returns true if the user has explicitly denied notification permissions */
export function isPermissionDenied() {
  if (isNative()) return false; // Capacitor handles this separately
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "denied";
}

/** Returns the current permission state: 'granted' | 'denied' | 'default' | 'unavailable' */
export function getPermissionState() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unavailable";
  return Notification.permission;
}

// ─────────────────────────────────────────────────────────────
// Badge count (Web Badge API + iOS badge via Capacitor)
// ─────────────────────────────────────────────────────────────
export async function setBadgeCount(count) {
  // Web Badge API (Chrome on Android/desktop)
  if ("setAppBadge" in navigator) {
    try {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
    } catch {
      // Badge API not available on this platform
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Timezone-aware date builder
// ─────────────────────────────────────────────────────────────
/**
 * Builds a Date object for a task's start time, optionally adjusted
 * by a reminder offset (in minutes). Uses the user's preferred timezone.
 *
 * @param {string} startTime "HH:MM"
 * @param {string} [timezone] IANA timezone string, e.g. "Asia/Tehran"
 * @param {number} [offsetMinutes=0] subtract this many minutes from the start time
 * @returns {Date}
 */
function buildScheduledDate(startTime, timezone, offsetMinutes = 0) {
  const [hours, minutes] = startTime.split(":").map(Number);

  // Build a date string for "today at HH:MM" in the target timezone
  const now = new Date();
  // Format today's date as YYYY-MM-DD in the desired timezone
  const todayInTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const isoString = `${todayInTz}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const taskDate = new Date(isoString);
  return new Date(taskDate.getTime() - offsetMinutes * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────
// Schedule task reminders
// ─────────────────────────────────────────────────────────────
export class NotificationService {
  /**
   * Schedule reminders for today's upcoming tasks.
   * @param {Array} tasks
   * @param {number} defaultReminderMinutes
   * @param {string} [userTimezone] IANA timezone from user profile
   */
  static async scheduleTaskReminders(tasks, defaultReminderMinutes = 30, userTimezone) {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const tz = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const todayStr = now.toDateString();

    const upcoming = tasks.filter(
      (t) =>
        !t.completed &&
        t.startTime &&
        (t.date === todayStr || t.type === "weekly_recurring")
    );

    if (isNative()) {
      await this._scheduleNative(upcoming, defaultReminderMinutes, tz, now);
    } else {
      // Web and Electron both use the same scheduling approach (setTimeout-based for in-tab).
      // For true background delivery on web, the SW handles push events from the server.
      // Here we schedule in-tab timers for tasks happening within the next 2 hours.
      this._scheduleInTabTimers(upcoming, defaultReminderMinutes, tz, now);
      // Register the service worker so background push works
      if (isWeb()) registerServiceWorker();
    }

    // Update badge with number of pending tasks today
    const pendingCount = tasks.filter((t) => !t.completed && t.date === todayStr).length;
    setBadgeCount(pendingCount);
  }

  // ── Native (Capacitor) ─────────────────────────────────────
  static async _scheduleNative(tasks, offsetMinutes, tz, now) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");

      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      const toSchedule = [];
      let id = 1;

      tasks.forEach((task) => {
        const fireAt = buildScheduledDate(task.startTime, tz, offsetMinutes);
        if (fireAt > now) {
          toSchedule.push({
            id: id++,
            title: `Upcoming: ${task.title}`,
            body: `Starts at ${task.startTime}`,
            schedule: { at: fireAt },
            // Deep-link payload: route to navigate to when notification is tapped
            extra: { route: "/", taskId: task.id },
            actionTypeId: "TASK_REMINDER",
          });
        }
      });

      if (toSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: toSchedule });
      }
    } catch (err) {
      console.error("[NotificationService] Native scheduling failed:", err);
    }
  }

  // ── Web / Electron in-tab timers ───────────────────────────
  static _scheduleInTabTimers(tasks, offsetMinutes, tz, now) {
    tasks.forEach((task) => {
      const fireAt = buildScheduledDate(task.startTime, tz, offsetMinutes);
      const delay = fireAt.getTime() - now.getTime();
      if (delay > 0 && delay < 2 * 60 * 60 * 1000) {
        // Only schedule for tasks within the next 2 hours to avoid huge timer queues
        setTimeout(() => {
          NotificationService._fire(
            `Upcoming: ${task.title}`,
            `Starts at ${task.startTime}`,
            "/"
          );
        }, delay);
      }
    });
  }

  // ── Unified fire (Web Notification API or Electron IPC) ────
  static _fire(title, body, route = "/") {
    if (isElectron()) {
      window.electronApp.showNotification(title, body, route);
      return;
    }
    if (isWeb() && Notification.permission === "granted") {
      const notif = new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: `chronosflow-${Date.now()}`,
        data: { route },
      });
      notif.onclick = () => {
        window.focus();
        if (route) window.location.hash = route;
        notif.close();
      };
    }
  }

  // ── Partner notification ────────────────────────────────────
  static async notifyPartnerProgress(task) {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    if (isNative()) {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        await LocalNotifications.schedule({
          notifications: [{
            id: 100000 + (Date.now() % 1000000000),
            title: "Partner progress 🎉",
            body: `Your partner completed: ${task.title}`,
            schedule: { at: new Date(Date.now() + 1000) },
            extra: { route: "/partner", taskId: task.id },
            actionTypeId: "PARTNER_UPDATE",
          }],
        });
      } catch (err) {
        console.error("[NotificationService] Partner notification failed:", err);
      }
    } else {
      setTimeout(() => {
        NotificationService._fire(
          "Partner progress 🎉",
          `Your partner completed: ${task.title}`,
          "/partner"
        );
      }, 1000);
    }
  }

  // ── Legacy compat alias ─────────────────────────────────────
  static async requestPermissions() {
    return requestNotificationPermission();
  }
}
