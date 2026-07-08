import api from "./ipcClient";

export const listCustomers = (userId) => api.customer.list(userId);
export const createCustomer = (payload, userId) => api.customer.create(payload, userId);
export const updateCustomer = (id, payload, userId) => api.customer.update(id, payload, userId);
export const deleteCustomer = (id, userId) => api.customer.remove(id, userId);
