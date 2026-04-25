const safeAPI = window.billingAPI || {
  invoice: { list: async () => [], create: async () => null, getById: async () => null, remove: async () => ({}) },
  customer: { list: async () => [], create: async (p) => p, update: async (_id, p) => p, remove: async () => ({}) },
  product: { list: async () => [], create: async (p) => p, update: async (_id, p) => p, remove: async () => ({}) },
  settings: { get: async () => null, save: async (p) => p, reset: async () => null }
};

export default safeAPI;
