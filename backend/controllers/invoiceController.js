const db = require("../db");
const { normalizeItems, calculateInvoiceTotals } = require("../services/billingService");

exports.listInvoices = (userId) => {
  if (!userId) return [];
  const invoices = db.prepare("SELECT * FROM invoices WHERE userId = ? ORDER BY id DESC").all(userId);
  const itemStmt = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?");
  return invoices.map((inv) => ({ ...inv, items: itemStmt.all(inv.id) }));
};

exports.getInvoiceById = (id, userId) => {
  if (!userId) return null;
  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ? AND userId = ?").get(id, userId);
  if (!invoice) return null;
  const items = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?").all(id);
  return { ...invoice, items };
};

const getNextInvoiceNo = (userId) => {
  const row = db
    .prepare(
      `
      SELECT COALESCE(MAX(CAST(invoiceNo AS INTEGER)), 0) + 1 AS nextInvoiceNo
      FROM invoices
      WHERE userId = ? AND invoiceNo <> '' AND invoiceNo NOT GLOB '*[^0-9]*'
      `
    )
    .get(userId || "");

  return String(row?.nextInvoiceNo || 1);
};

exports.createInvoice = (payload, userId) => {
  if (!userId) throw new Error("Unauthorized");
  const items = normalizeItems(payload.items || []);
  const totals = calculateInvoiceTotals(items, Number(payload.gstPercent || 0));
  const selectedDate = typeof payload.invoiceDate === "string" ? payload.invoiceDate.trim() : "";
  const createdAt = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
    ? `${selectedDate}T00:00:00`
    : null;

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoiceNo, customerId, gstPercent, subtotal, gstAmount, total, notes, createdAt, industry, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO invoice_items (
      invoiceId, description, quantity, unit, meters, pricePerMeter, lineTotal,
      width, height, makingCharges, serialNumber, batchNo, expiryDate, mrp, partNumber, industry
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const invoiceNo = getNextInvoiceNo(userId);
    const invoiceResult = insertInvoice.run(
      invoiceNo,
      payload.customerId || null,
      totals.gstPercent,
      totals.subtotal,
      totals.gstAmount,
      totals.total,
      payload.notes || "",
      createdAt,
      payload.industry || null,
      userId
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
        item.lineTotal,
        item.width,
        item.height,
        item.makingCharges,
        item.serialNumber,
        item.batchNo,
        item.expiryDate,
        item.mrp,
        item.partNumber,
        item.industry
      );
    });

    return invoiceId;
  });

  const invoiceId = transaction();
  return exports.getInvoiceById(invoiceId, userId);
};

exports.deleteInvoice = (id, userId) => {
  if (!userId) throw new Error("Unauthorized");
  const invoice = db.prepare("SELECT id FROM invoices WHERE id = ? AND userId = ?").get(id, userId);
  if (!invoice) throw new Error("Unauthorized");

  db.prepare("DELETE FROM invoice_items WHERE invoiceId = ?").run(id);
  return db.prepare("DELETE FROM invoices WHERE id = ? AND userId = ?").run(id, userId);
};
