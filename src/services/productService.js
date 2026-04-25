import api from "./ipcClient";

export const listProducts = () => api.product.list();
export const createProduct = (payload) => api.product.create(payload);
export const updateProduct = (id, payload) => api.product.update(id, payload);
export const deleteProduct = (id) => api.product.remove(id);
