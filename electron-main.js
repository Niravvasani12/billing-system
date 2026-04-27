const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const appConfig = require("./config/appConfig");
const registerInvoiceIPC = require("./ipc/invoiceIPC");
const registerCustomerIPC = require("./ipc/customerIPC");
const registerProductIPC = require("./ipc/productIPC");
const registerSettingsIPC = require("./ipc/settingsIPC");

const UPDATE_STATUS_CHANNEL = "app:update-status";
const UPDATE_CHECK_INTERVAL_MS = 1000 * 60 * 60 * 4;
let mainWindow = null;

function sendUpdateStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(UPDATE_STATUS_CHANNEL, payload);
  }
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus({
      status: "checking",
      message: "Checking for updates...",
    });
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdateStatus({
      status: "available",
      version: info?.version,
      message: `Update ${info?.version || ""} is available. Downloading...`.trim(),
    });
  });

  autoUpdater.on("update-not-available", () => {
    sendUpdateStatus({
      status: "not-available",
      message: "You are on the latest version.",
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    sendUpdateStatus({
      status: "downloading",
      progress: Math.round(progressObj.percent || 0),
      message: "Downloading update...",
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateStatus({
      status: "downloaded",
      version: info?.version,
      message: "Update is ready. Click Update Now to restart and install.",
    });
  });

  autoUpdater.on("error", (err) => {
    sendUpdateStatus({
      status: "error",
      message: err?.message || "Update check failed.",
    });
  });
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    sendUpdateStatus({
      status: "dev-mode",
      message: "Auto-update works in installed app builds only.",
    });
    return { ok: false, reason: "dev-mode" };
  }

  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (error) {
    sendUpdateStatus({
      status: "error",
      message: error?.message || "Unable to check for updates.",
    });
    return { ok: false, reason: "error" };
  }
}

function registerAppIPC() {
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:check-for-updates", checkForUpdates);
  ipcMain.handle("app:install-update", () => {
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
  });
}

function createWindow() {
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, "public", "app-icon.png")
    : path.join(__dirname, "dist", "app-icon.png");

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: appConfig.appName,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = win;

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  configureAutoUpdater();
  registerAppIPC();

  registerInvoiceIPC();
  registerCustomerIPC();
  registerProductIPC();
  registerSettingsIPC();

  createWindow();
  checkForUpdates();
  setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
