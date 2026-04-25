const { ipcMain } = require("electron");
const productController = require("../backend/controllers/productController");

module.exports = function registerProductIPC() {
  ipcMain.handle("product:list", () => productController.listProducts());
  ipcMain.handle("product:create", (_event, payload) => productController.createProduct(payload));
  ipcMain.handle("product:update", (_event, id, payload) => productController.updateProduct(id, payload));
  ipcMain.handle("product:delete", (_event, id) => productController.deleteProduct(id));
};
