const { ipcMain } = require("electron");
const customerController = require("../backend/controllers/customerController");

module.exports = function registerCustomerIPC() {
  ipcMain.handle("customer:list", (_event, userId) => customerController.listCustomers(userId));
  ipcMain.handle("customer:create", (_event, payload, userId) => customerController.createCustomer(payload, userId));
  ipcMain.handle("customer:update", (_event, id, payload, userId) => customerController.updateCustomer(id, payload, userId));
  ipcMain.handle("customer:delete", (_event, id, userId) => customerController.deleteCustomer(id, userId));
};
