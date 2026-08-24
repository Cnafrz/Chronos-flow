const { app, BrowserWindow, shell, Tray, Menu } = require("electron");

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

const isDev = !app.isPackaged;

const stateFile = path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch {
    return null;
  }
}

function saveWindowState(bounds) {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(bounds));
  } catch {
    /* ignore */
  }
}

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  const saved = loadWindowState();

  const win = new BrowserWindow({
    width: saved?.width || 1100,
    height: saved?.height || 800,
    x: saved?.x,
    y: saved?.y,
    minWidth: 420,
    minHeight: 560,
    show: false,
    backgroundColor: "#ffffff",
    title: "ChoronosFlow",
    icon: path.join(__dirname, "..", "icons", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow = win;

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.once("ready-to-show", () => win.show());

  const save = () => {
    if (!win.isNormal()) return;
    const b = win.getBounds();
    saveWindowState({ x: b.x, y: b.y, width: b.width, height: b.height });
  };
  win.on("resize", save);
  win.on("move", save);

  // Open external links in the default browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function setupAutoUpdater() {
  if (isDev) return;
  autoUpdater.autoDownload = false;
  autoUpdater.on("update-available", () => {
    // Auto-updater architecture ready — wire up a notification dialog when ready to ship updates.
  });
  autoUpdater.on("error", () => {
    /* silently ignore update errors in offline mode */
  });
  try {
    autoUpdater.checkForUpdates();
  } catch {
    /* ignore */
  }
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  const { nativeImage } = require('electron');
  const iconPath = path.join(__dirname, "..", "icons", "icon.png");
  
  let trayImage;
  if (fs.existsSync(iconPath)) {
    trayImage = nativeImage.createFromPath(iconPath);
  } else {
    // Fallback: A simple colored 16x16 icon in base64
    const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKElEQVR42mNkYPhfz0AEYBxVSF+NhIFRw2iEUcBohFFAH4yG4f96BgYAC7sC+W6o7nAAAAAASUVORK5CYII=";
    trayImage = nativeImage.createFromDataURL(fallbackBase64);
  }
  
  tray = new Tray(trayImage);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => mainWindow?.show() },
    { label: "Quit ChronosFlow", click: () => { isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip("ChronosFlow");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => mainWindow?.show());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});