const { ipcMain } = require("electron");
const settingsService = require("../backend/services/settingsService");

module.exports = function registerSettingsIPC() {
  ipcMain.handle("settings:get", () => settingsService.getSettings());
  ipcMain.handle("settings:save", (_event, payload) => settingsService.saveSettings(payload || {}));
  ipcMain.handle("settings:reset", () => settingsService.resetSettings());
};
