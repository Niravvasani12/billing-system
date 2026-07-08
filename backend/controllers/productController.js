const db = require("../db");

exports.listProducts = (userId) => {
  if (!userId) return [];
  return db.prepare("SELECT * FROM products WHERE userId = ? ORDER BY id DESC").all(userId);
};

exports.createProduct = (payload, userId) => {
  if (!userId) throw new Error("Unauthorized");
  const stmt = db.prepare("INSERT INTO products (name, sku, pricePerMeter, userId) VALUES (?, ?, ?, ?)");
  const result = stmt.run(payload.name, payload.sku || "", Number(payload.pricePerMeter || 0), userId);
  return db.prepare("SELECT * FROM products WHERE id = ? AND userId = ?").get(result.lastInsertRowid, userId);
};

exports.updateProduct = (id, payload, userId) => {
  if (!userId) throw new Error("Unauthorized");
  const stmt = db.prepare("UPDATE products SET name = ?, sku = ?, pricePerMeter = ? WHERE id = ? AND userId = ?");
  stmt.run(payload.name, payload.sku || "", Number(payload.pricePerMeter || 0), id, userId);
  return db.prepare("SELECT * FROM products WHERE id = ? AND userId = ?").get(id, userId);
};

exports.deleteProduct = (id, userId) => {
  if (!userId) throw new Error("Unauthorized");
  return db.prepare("DELETE FROM products WHERE id = ? AND userId = ?").run(id, userId);
};
