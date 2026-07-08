const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("billingAPI", {
  app: {
    getVersion: () => ipcRenderer.invoke("app:get-version"),
    checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
    installUpdate: () => ipcRenderer.invoke("app:install-update"),
    onUpdateStatus: (callback) => {
      const listener = (_, payload) => callback(payload);
      ipcRenderer.on("app:update-status", listener);
      return () => ipcRenderer.removeListener("app:update-status", listener);
    },
  },
  invoice: {
    list: (userId) => ipcRenderer.invoke("invoice:list", userId),
    create: (payload, userId) => ipcRenderer.invoke("invoice:create", payload, userId),
    getById: (id, userId) => ipcRenderer.invoke("invoice:getById", id, userId),
    remove: (id, userId) => ipcRenderer.invoke("invoice:delete", id, userId)
  },
  customer: {
    list: (userId) => ipcRenderer.invoke("customer:list", userId),
    create: (payload, userId) => ipcRenderer.invoke("customer:create", payload, userId),
    update: (id, payload, userId) => ipcRenderer.invoke("customer:update", id, payload, userId),
    remove: (id, userId) => ipcRenderer.invoke("customer:delete", id, userId)
  },
  product: {
    list: (userId) => ipcRenderer.invoke("product:list", userId),
    create: (payload, userId) => ipcRenderer.invoke("product:create", payload, userId),
    update: (id, payload, userId) => ipcRenderer.invoke("product:update", id, payload, userId),
    remove: (id, userId) => ipcRenderer.invoke("product:delete", id, userId)
  },
  settings: {
    get: (userId) => ipcRenderer.invoke("settings:get", userId),
    save: (payload, userId) => ipcRenderer.invoke("settings:save", payload, userId),
    reset: (userId) => ipcRenderer.invoke("settings:reset", userId)
  }
});
