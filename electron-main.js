const { app, BrowserWindow } = require("electron");
const path = require("path");

const appConfig = require("./config/appConfig");
const registerInvoiceIPC = require("./ipc/invoiceIPC");
const registerCustomerIPC = require("./ipc/customerIPC");
const registerProductIPC = require("./ipc/productIPC");
const registerSettingsIPC = require("./ipc/settingsIPC");

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
      sandbox: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  registerInvoiceIPC();
  registerCustomerIPC();
  registerProductIPC();
  registerSettingsIPC();

  createWindow();

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
