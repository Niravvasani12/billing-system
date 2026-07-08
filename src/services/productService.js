import api from "./ipcClient";

export const listProducts = (userId) => api.product.list(userId);
export const createProduct = (payload, userId) => api.product.create(payload, userId);
export const updateProduct = (id, payload, userId) => api.product.update(id, payload, userId);
export const deleteProduct = (id, userId) => api.product.remove(id, userId);
