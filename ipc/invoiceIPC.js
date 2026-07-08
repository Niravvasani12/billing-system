const { ipcMain } = require("electron");
const invoiceController = require("../backend/controllers/invoiceController");

module.exports = function registerInvoiceIPC() {
  ipcMain.handle("invoice:list", (_event, userId) => invoiceController.listInvoices(userId));
  ipcMain.handle("invoice:getById", (_event, id, userId) => invoiceController.getInvoiceById(id, userId));
  ipcMain.handle("invoice:create", (_event, payload, userId) => invoiceController.createInvoice(payload, userId));
  ipcMain.handle("invoice:delete", (_event, id, userId) => invoiceController.deleteInvoice(id, userId));
};
