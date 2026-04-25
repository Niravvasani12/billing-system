const db = require("../db");

exports.listProducts = () => db.prepare("SELECT * FROM products ORDER BY id DESC").all();

exports.createProduct = (payload) => {
  const stmt = db.prepare("INSERT INTO products (name, sku, pricePerMeter) VALUES (?, ?, ?)");
  const result = stmt.run(payload.name, payload.sku || "", Number(payload.pricePerMeter || 0));
  return db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
};

exports.updateProduct = (id, payload) => {
  const stmt = db.prepare("UPDATE products SET name = ?, sku = ?, pricePerMeter = ? WHERE id = ?");
  stmt.run(payload.name, payload.sku || "", Number(payload.pricePerMeter || 0), id);
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
};

exports.deleteProduct = (id) => db.prepare("DELETE FROM products WHERE id = ?").run(id);
