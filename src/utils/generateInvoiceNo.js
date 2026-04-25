export const generateInvoiceNo = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-6)}`;
};
