const db = require("../db");

exports.listCustomers = (userId) => {
  if (!userId) return [];
  return db.prepare("SELECT * FROM customers WHERE userId = ? ORDER BY id DESC").all(userId);
};

exports.createCustomer = (payload, userId) => {
  if (!userId) throw new Error("Unauthorized");
  const stmt = db.prepare("INSERT INTO customers (name, phone, email, address, userId) VALUES (?, ?, ?, ?, ?)");
  const result = stmt.run(payload.name, payload.phone || "", payload.email || "", payload.address || "", userId);
  return db.prepare("SELECT * FROM customers WHERE id = ? AND userId = ?").get(result.lastInsertRowid, userId);
};

exports.updateCustomer = (id, payload, userId) => {
  if (!userId) throw new Error("Unauthorized");
  const stmt = db.prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ? AND userId = ?");
  stmt.run(payload.name, payload.phone || "", payload.email || "", payload.address || "", id, userId);
  return db.prepare("SELECT * FROM customers WHERE id = ? AND userId = ?").get(id, userId);
};

exports.deleteCustomer = (id, userId) => {
  if (!userId) throw new Error("Unauthorized");
  return db.prepare("DELETE FROM customers WHERE id = ? AND userId = ?").run(id, userId);
};
