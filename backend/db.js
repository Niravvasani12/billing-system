const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const Database = require("better-sqlite3");

const copyIfExists = (sourcePath, targetPath) => {
  if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
    fs.copyFileSync(sourcePath, targetPath);
  }
};

const migrateLegacyDb = (targetDbPath) => {
  const candidates = [];

  if (app?.getPath) {
    candidates.push(path.join(app.getPath("userData"), "billing.sqlite"));
  }

  candidates.push(path.join(__dirname, "..", "database", "billing.sqlite"));

  const legacyDbPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!legacyDbPath || fs.existsSync(targetDbPath)) return;

  copyIfExists(legacyDbPath, targetDbPath);
  copyIfExists(`${legacyDbPath}-wal`, `${targetDbPath}-wal`);
  copyIfExists(`${legacyDbPath}-shm`, `${targetDbPath}-shm`);
};

const resolveDbPath = () => {
  const persistentDir = app?.getPath?.("appData")
    ? path.join(app.getPath("appData"), "BillingSystemData")
    : path.join(__dirname, "..", "database");

  if (!fs.existsSync(persistentDir)) {
    fs.mkdirSync(persistentDir, { recursive: true });
  }

  const dbPath = path.join(persistentDir, "billing.sqlite");
  migrateLegacyDb(dbPath);
  return dbPath;
};

const dbPath = resolveDbPath();
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    pricePerMeter REAL NOT NULL DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNo TEXT NOT NULL UNIQUE,
    customerId INTEGER,
    gstPercent REAL NOT NULL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0,
    gstAmount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceId INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    meters REAL NOT NULL,
    pricePerMeter REAL NOT NULL,
    lineTotal REAL NOT NULL,
    FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE
  );
`);

module.exports = db;
