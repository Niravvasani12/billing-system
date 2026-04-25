const { ipcMain } = require("electron");
const customerController = require("../backend/controllers/customerController");

module.exports = function registerCustomerIPC() {
  ipcMain.handle("customer:list", () => customerController.listCustomers());
  ipcMain.handle("customer:create", (_event, payload) => customerController.createCustomer(payload));
  ipcMain.handle("customer:update", (_event, id, payload) => customerController.updateCustomer(id, payload));
  ipcMain.handle("customer:delete", (_event, id) => customerController.deleteCustomer(id));
};
