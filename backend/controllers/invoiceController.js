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

exports.createInvoice = (payload) => {
  const items = normalizeItems(payload.items || []);
  const totals = calculateInvoiceTotals(items, Number(payload.gstPercent || 0));

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoiceNo, customerId, gstPercent, subtotal, gstAmount, total, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO invoice_items (invoiceId, description, quantity, unit, meters, pricePerMeter, lineTotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const invoiceResult = insertInvoice.run(
      payload.invoiceNo,
      payload.customerId || null,
      totals.gstPercent,
      totals.subtotal,
      totals.gstAmount,
      totals.total,
      payload.notes || ""
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
