const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("billingAPI", {
  invoice: {
    list: () => ipcRenderer.invoke("invoice:list"),
    create: (payload) => ipcRenderer.invoke("invoice:create", payload),
    getById: (id) => ipcRenderer.invoke("invoice:getById", id),
    remove: (id) => ipcRenderer.invoke("invoice:delete", id)
  },
  customer: {
    list: () => ipcRenderer.invoke("customer:list"),
    create: (payload) => ipcRenderer.invoke("customer:create", payload),
    update: (id, payload) => ipcRenderer.invoke("customer:update", id, payload),
    remove: (id) => ipcRenderer.invoke("customer:delete", id)
  },
  product: {
    list: () => ipcRenderer.invoke("product:list"),
    create: (payload) => ipcRenderer.invoke("product:create", payload),
    update: (id, payload) => ipcRenderer.invoke("product:update", id, payload),
    remove: (id) => ipcRenderer.invoke("product:delete", id)
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (payload) => ipcRenderer.invoke("settings:save", payload),
    reset: () => ipcRenderer.invoke("settings:reset")
  }
});
