const db = require("../db");

exports.getSummary = () => {
  const totals = db.prepare("SELECT COUNT(*) AS invoiceCount, COALESCE(SUM(total),0) AS revenue FROM invoices").get();
  const latest = db.prepare("SELECT * FROM invoices ORDER BY id DESC LIMIT 10").all();
  return { ...totals, latest };
};
