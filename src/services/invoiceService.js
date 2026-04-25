import api from "./ipcClient";

export const listInvoices = () => api.invoice.list();
export const createInvoice = (payload) => api.invoice.create(payload);
export const getInvoice = (id) => api.invoice.getById(id);
export const deleteInvoice = (id) => api.invoice.remove(id);
