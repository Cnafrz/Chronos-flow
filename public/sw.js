// Service Worker for ChronosFlow Web Push Notifications
// Registered by NotificationService.js when running in a browser context

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Handle push messages from FCM or any push backend
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "ChronosFlow", body: event.data.text(), route: "/" };
  }

  const options = {
    body: payload.body || "",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: payload.tag || "chronosflow-notification",
    data: { route: payload.route || "/" },
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "ChronosFlow", options)
  );
});

// Deep-link: clicking the notification opens/focuses the app on the correct route
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = event.notification.data?.route || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If an app tab is already open, focus it and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({ type: "NAVIGATE", route });
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(`/${route.startsWith("/") ? route.slice(1) : route}`);
        }
      })
  );
});
