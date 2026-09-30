const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronApp", {
  version: process.env.npm_package_version || "1.0.0",
  platform: process.platform,
  // Notification bridge: renderer calls this to trigger a native OS notification
  showNotification: (title, body, route) => {
    ipcRenderer.send("show-notification", { title, body, route });
  },
});