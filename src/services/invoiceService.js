import api from "./ipcClient";

export const listInvoices = (userId) => api.invoice.list(userId);
export const createInvoice = (payload, userId) => api.invoice.create(payload, userId);
export const getInvoice = (id, userId) => api.invoice.getById(id, userId);
export const deleteInvoice = (id, userId) => api.invoice.remove(id, userId);
