const db = require("../db");

exports.listCustomers = () => db.prepare("SELECT * FROM customers ORDER BY id DESC").all();

exports.createCustomer = (payload) => {
  const stmt = db.prepare("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)");
  const result = stmt.run(payload.name, payload.phone || "", payload.email || "", payload.address || "");
  return db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid);
};

exports.updateCustomer = (id, payload) => {
  const stmt = db.prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?");
  stmt.run(payload.name, payload.phone || "", payload.email || "", payload.address || "", id);
  return db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
};

exports.deleteCustomer = (id) => db.prepare("DELETE FROM customers WHERE id = ?").run(id);
