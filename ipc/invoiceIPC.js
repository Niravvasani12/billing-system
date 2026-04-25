const { ipcMain } = require("electron");
const invoiceController = require("../backend/controllers/invoiceController");

module.exports = function registerInvoiceIPC() {
  ipcMain.handle("invoice:list", () => invoiceController.listInvoices());
  ipcMain.handle("invoice:getById", (_event, id) => invoiceController.getInvoiceById(id));
  ipcMain.handle("invoice:create", (_event, payload) => invoiceController.createInvoice(payload));
  ipcMain.handle("invoice:delete", (_event, id) => invoiceController.deleteInvoice(id));
};
