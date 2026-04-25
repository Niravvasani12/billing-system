import api from "./ipcClient";

export const listCustomers = () => api.customer.list();
export const createCustomer = (payload) => api.customer.create(payload);
export const updateCustomer = (id, payload) => api.customer.update(id, payload);
export const deleteCustomer = (id) => api.customer.remove(id);
