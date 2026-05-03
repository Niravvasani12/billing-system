const db = require("../db");
const { normalizeItems, calculateInvoiceTotals } = require("../services/billingService");

exports.listInvoices = () => {
  const invoices = db.prepare("SELECT * FROM invoices ORDER BY id DESC").all();
  const itemStmt = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?");
  return invoices.map((inv) => ({ ...inv, items: itemStmt.all(inv.id) }));
};

exports.getInvoiceById = (id) => {
  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
  if (!invoice) return null;
  const items = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?").all(id);
  return { ...invoice, items };
};

const getNextInvoiceNo = () => {
  const row = db
    .prepare(
      `
      SELECT COALESCE(MAX(CAST(invoiceNo AS INTEGER)), 0) + 1 AS nextInvoiceNo
      FROM invoices
      WHERE invoiceNo <> '' AND invoiceNo NOT GLOB '*[^0-9]*'
      `
    )
    .get();

  return String(row?.nextInvoiceNo || 1);
};

exports.createInvoice = (payload) => {
  const items = normalizeItems(payload.items || []);
  const totals = calculateInvoiceTotals(items, Number(payload.gstPercent || 0));
  const selectedDate = typeof payload.invoiceDate === "string" ? payload.invoiceDate.trim() : "";
  const createdAt = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
    ? `${selectedDate}T00:00:00`
    : null;

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoiceNo, customerId, gstPercent, subtotal, gstAmount, total, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
  `);
  const insertItem = db.prepare(`
    INSERT INTO invoice_items (invoiceId, description, quantity, unit, meters, pricePerMeter, lineTotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const invoiceNo = getNextInvoiceNo();
    const invoiceResult = insertInvoice.run(
      invoiceNo,
      payload.customerId || null,
      totals.gstPercent,
      totals.subtotal,
      totals.gstAmount,
      totals.total,
      payload.notes || "",
      createdAt
    );

    const invoiceId = invoiceResult.lastInsertRowid;
    items.forEach((item) => {
      insertItem.run(
        invoiceId,
        item.description,
        item.quantity,
        item.unit,
        item.meters,
        item.pricePerMeter,
        item.lineTotal
      );
    });

    return invoiceId;
  });

  const invoiceId = transaction();
  return exports.getInvoiceById(invoiceId);
};

exports.deleteInvoice = (id) => {
  db.prepare("DELETE FROM invoice_items WHERE invoiceId = ?").run(id);
  return db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
};
