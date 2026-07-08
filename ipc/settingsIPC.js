const { ipcMain } = require("electron");
const settingsService = require("../backend/services/settingsService");

module.exports = function registerSettingsIPC() {
  ipcMain.handle("settings:get", (_event, userId) => settingsService.getSettings(userId));
  ipcMain.handle("settings:save", (_event, payload, userId) => settingsService.saveSettings(payload || {}, userId));
  ipcMain.handle("settings:reset", (_event, userId) => settingsService.resetSettings(userId));
};
