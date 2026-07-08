const { ipcMain } = require("electron");
const productController = require("../backend/controllers/productController");

module.exports = function registerProductIPC() {
  ipcMain.handle("product:list", (_event, userId) => productController.listProducts(userId));
  ipcMain.handle("product:create", (_event, payload, userId) => productController.createProduct(payload, userId));
  ipcMain.handle("product:update", (_event, id, payload, userId) => productController.updateProduct(id, payload, userId));
  ipcMain.handle("product:delete", (_event, id, userId) => productController.deleteProduct(id, userId));
};
