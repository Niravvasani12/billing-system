import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaArrowRight,
  FaBoxes,
  FaClipboardList,
  FaDownload,
  FaEdit,
  FaExchangeAlt,
  FaEye,
  FaPlus,
  FaSave,
  FaSearch,
  FaShoppingCart,
  FaTruckLoading,
} from "react-icons/fa";
import { formatCurrency } from "../utils/formatCurrency";

const emptyOpening = {
  itemName: "",
  sku: "",
  category: "General",
  warehouse: "Main Store",
  quantity: 0,
  rate: 0,
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const emptyMovement = {
  itemName: "",
  sku: "",
  warehouse: "Main Store",
  partyName: "",
  referenceNo: "",
  quantity: 1,
  rate: 0,
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const emptyAdjustment = {
  itemId: "",
  type: "Positive Adjustment",
  quantity: 0,
  rate: 0,
  reason: "Manual correction",
  notes: "",
  date: new Date().toISOString().slice(0, 10),
};

const categories = ["General", "Electronics", "Raw Material", "Furniture", "Textile", "Packaging"];
const warehouses = ["Main Store", "Warehouse A", "Warehouse B", "Shop Floor"];

const readRecords = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`billing:inventory-records:${userId}`) || "[]");
  } catch {
    return [];
  }
};

const writeRecords = (userId, records) => {
  localStorage.setItem(`billing:inventory-records:${userId}`, JSON.stringify(records));
};

const getInitialStock = (products) =>
  products.slice(0, 5).map((product, index) => ({
    id: `product-seed-${product.id}`,
    itemName: product.name,
    sku: product.sku || `SKU-${String(index + 1).padStart(3, "0")}`,
    category: product.category || categories[index % categories.length],
    warehouse: warehouses[index % warehouses.length],
    quantity: Number(product.stock || 0),
    rate: Number(product.pricePerMeter || 0),
    date: new Date().toISOString().slice(0, 10),
    notes: "Product catalogue stock",
    source: "catalogue",
  }));

const stockValue = (row) => Number(row.quantity || 0) * Number(row.rate || 0);

function InventoryDashboard({ stockItems, movements, onNavigate }) {
  const totalValue = stockItems.reduce((sum, row) => sum + stockValue(row), 0);
  const totalUnits = stockItems.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const lowStock = stockItems.filter((row) => Number(row.quantity || 0) <= 10).length;
  const recentMovements = movements.slice(0, 5);

  return (
    <div className="inventory-workspace">
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory</p>
          <h1>Inventory Dashboard Page</h1>
          <span>Real-time oversight of stock value, movement, and shopkeeper inventory health.</span>
        </div>
        <button type="button" onClick={() => onNavigate("opening-add")}><FaPlus /> Add Opening Stock</button>
      </div>

      <div className="inventory-kpis">
        <article className="inventory-kpi primary">
          <span><FaBoxes /></span>
          <p>Stock Valuation</p>
          <h2>{formatCurrency(totalValue)}</h2>
          <small>{totalUnits} total units across warehouses</small>
        </article>
        <article className="inventory-kpi warning">
          <span><FaClipboardList /></span>
          <p>Urgent Attention</p>
          <h2>{lowStock} Items</h2>
          <small>Below reorder level</small>
        </article>
        <article className="inventory-mini-stack">
          <div><strong>{movements.filter((m) => m.mode === "purchase").length}</strong><span>Purchase Entries</span></div>
          <div><strong>{movements.filter((m) => m.mode === "sales").length}</strong><span>Sales Entries</span></div>
        </article>
      </div>

      <div className="inventory-action-grid">
        <button type="button" onClick={() => onNavigate("opening-main")}><FaTruckLoading /> Opening Stock <FaArrowRight /></button>
        <button type="button" onClick={() => onNavigate("purchase-entry")}><FaShoppingCart /> Purchase Stock Entry <FaArrowRight /></button>
        <button type="button" onClick={() => onNavigate("sales-entry")}><FaExchangeAlt /> Sales Stock Entry <FaArrowRight /></button>
        <button type="button" onClick={() => onNavigate("stock-list")}><FaBoxes /> Stock List <FaArrowRight /></button>
      </div>

      <div className="inventory-dashboard-grid">
        <section className="inventory-panel">
          <div className="inventory-section-head">
            <div>
              <p>Warehouse Distribution</p>
              <h3>Current Capacity</h3>
            </div>
            <button type="button" className="inventory-light-btn" onClick={() => onNavigate("stock-list")}>View Stock</button>
          </div>
          <div className="inventory-warehouse-bars">
            {warehouses.map((warehouse) => {
              const qty = stockItems.filter((row) => row.warehouse === warehouse).reduce((sum, row) => sum + Number(row.quantity || 0), 0);
              const width = totalUnits ? Math.max(8, (qty / totalUnits) * 100) : 8;
              return (
                <div key={warehouse}>
                  <span>{warehouse}</span>
                  <b><i style={{ width: `${width}%` }} /></b>
                  <strong>{qty}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="inventory-panel">
          <div className="inventory-section-head">
            <div>
              <p>Critical Stock Alerts</p>
              <h3>Low Stock Items</h3>
            </div>
            <span className="inventory-chip danger">{lowStock} Alerts</span>
          </div>
          {stockItems.filter((row) => Number(row.quantity || 0) <= 10).slice(0, 4).map((row) => (
            <div className="inventory-alert-row" key={row.id}>
              <strong>{row.itemName}</strong>
              <span>{row.quantity} left in {row.warehouse}</span>
            </div>
          ))}
          {lowStock === 0 ? <p className="muted">No critical stock alerts right now.</p> : null}
        </section>
      </div>

      <section className="inventory-panel">
        <div className="inventory-section-head">
          <div>
            <p>Movement Register</p>
            <h3>Recent Stock Movements</h3>
          </div>
          <button type="button" className="inventory-light-btn" onClick={() => onNavigate("stock-list")}>View Full Ledger</button>
        </div>
        <MovementTable movements={recentMovements} />
      </section>
    </div>
  );
}

function OpeningStockMain({ stockItems, onNavigate }) {
  const totalValue = stockItems.reduce((sum, row) => sum + stockValue(row), 0);

  return (
    <div className="inventory-workspace">
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory / Opening Stock</p>
          <h1>Opening Stock Main Page</h1>
          <span>Establish initial quantities before daily purchase and sales transactions begin.</span>
        </div>
      </div>
      <div className="inventory-open-grid">
        <article className="inventory-entry-card">
          <span><FaEdit /></span>
          <h3>Manual Entry</h3>
          <p>Add items with batch details, warehouse location, date, quantity, and valuation rate.</p>
          <button type="button" onClick={() => onNavigate("opening-add")}>Add Opening Stock</button>
        </article>
        <article className="inventory-entry-card muted-card">
          <span><FaDownload /></span>
          <h3>Bulk Import</h3>
          <p>Template-based upload area for later Excel import support.</p>
          <button type="button" onClick={() => alert("Bulk import template will be added in a future update.")}>Download Template</button>
        </article>
        <article className="inventory-entry-card">
          <span><FaClipboardList /></span>
          <h3>Entry History & Audit Log</h3>
          <p>{stockItems.length} opening entries recorded with {formatCurrency(totalValue)} valuation.</p>
          <button type="button" onClick={() => onNavigate("opening-list")}>View Log</button>
        </article>
      </div>
      <section className="inventory-panel">
        <StockTable rows={stockItems.slice(0, 5)} onView={(id) => onNavigate("stock-detail", id)} />
      </section>
    </div>
  );
}

function OpeningStockForm({ onSave, onCancel }) {
  const [form, setForm] = useState(emptyOpening);
  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <form className="inventory-workspace" onSubmit={handleSubmit}>
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory / Opening Stock</p>
          <h1>Add Opening Stock Page</h1>
          <span>Initial stock form for shopkeepers to enter quantity, warehouse, category, and cost.</span>
        </div>
        <button type="button" className="inventory-light-btn" onClick={onCancel}>Cancel</button>
      </div>
      <section className="inventory-panel inventory-form-panel">
        <div className="form-grid-4">
          <input value={form.itemName} onChange={(event) => updateForm({ itemName: event.target.value })} placeholder="Item name" required />
          <input value={form.sku} onChange={(event) => updateForm({ sku: event.target.value })} placeholder="SKU / barcode" />
          <select value={form.category} onChange={(event) => updateForm({ category: event.target.value })}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <select value={form.warehouse} onChange={(event) => updateForm({ warehouse: event.target.value })}>
            {warehouses.map((warehouse) => <option key={warehouse}>{warehouse}</option>)}
          </select>
          <input type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => updateForm({ quantity: event.target.value })} placeholder="Opening quantity" />
          <input type="number" min="0" step="0.01" value={form.rate} onChange={(event) => updateForm({ rate: event.target.value })} placeholder="Valuation rate" />
          <input type="date" value={form.date} onChange={(event) => updateForm({ date: event.target.value })} />
          <div className="inventory-value-box">{formatCurrency(Number(form.quantity || 0) * Number(form.rate || 0))}</div>
        </div>
        <textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} placeholder="Notes, batch, rack, or opening reason" />
      </section>
      <div className="inventory-form-footer">
        <button type="button" className="inventory-light-btn" onClick={onCancel}>Discard</button>
        <button type="submit"><FaSave /> Save Opening Stock</button>
      </div>
    </form>
  );
}

function OpeningStockList({ stockItems, onNavigate }) {
  return (
    <div className="inventory-workspace">
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory / Opening Stock</p>
          <h1>Opening Stock List Page</h1>
          <span>All opening entries with warehouse, quantity, valuation, date, and action controls.</span>
        </div>
        <button type="button" onClick={() => onNavigate("opening-add")}><FaPlus /> Add Opening Entry</button>
      </div>
      <section className="inventory-panel">
        <StockTable rows={stockItems} onView={(id) => onNavigate("stock-detail", id)} />
      </section>
    </div>
  );
}

function MovementForm({ mode, stockItems, onSave, onCancel }) {
  const [form, setForm] = useState(emptyMovement);
  const selected = stockItems.find((row) => row.id === form.itemId);
  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSelect = (id) => {
    const row = stockItems.find((item) => item.id === id);
    updateForm({
      itemId: id,
      itemName: row?.itemName || "",
      sku: row?.sku || "",
      warehouse: row?.warehouse || "Main Store",
      rate: row?.rate || 0,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ ...form, mode });
  };

  const isPurchase = mode === "purchase";
  return (
    <form className="inventory-workspace" onSubmit={handleSubmit}>
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory / Stock Movement</p>
          <h1>{isPurchase ? "Purchase Stock Entry Page" : "Sales Stock Entry Page"}</h1>
          <span>{isPurchase ? "Increase stock from supplier purchase bills." : "Deduct stock from sales bills and manual sales entries."}</span>
        </div>
        <button type="button" className="inventory-light-btn" onClick={onCancel}>Discard</button>
      </div>
      <div className="inventory-movement-grid">
        <section className="inventory-panel">
          <div className="inventory-section-head">
            <div>
              <p>Entry Information</p>
              <h3>{isPurchase ? "Supplier Stock Inward" : "Sales Delivery Note"}</h3>
            </div>
          </div>
          <div className="form-grid-2">
            <select value={form.itemId || ""} onChange={(event) => handleSelect(event.target.value)} required>
              <option value="">Select stock item</option>
              {stockItems.map((row) => <option key={row.id} value={row.id}>{row.itemName} - {row.sku}</option>)}
            </select>
            <input value={form.referenceNo} onChange={(event) => updateForm({ referenceNo: event.target.value })} placeholder={isPurchase ? "Purchase bill no." : "Sales invoice no."} />
            <input value={form.partyName} onChange={(event) => updateForm({ partyName: event.target.value })} placeholder={isPurchase ? "Supplier name" : "Customer name"} />
            <input type="date" value={form.date} onChange={(event) => updateForm({ date: event.target.value })} />
            <select value={form.warehouse} onChange={(event) => updateForm({ warehouse: event.target.value })}>
              {warehouses.map((warehouse) => <option key={warehouse}>{warehouse}</option>)}
            </select>
            <input type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => updateForm({ quantity: event.target.value })} placeholder="Quantity" />
            <input type="number" min="0" step="0.01" value={form.rate} onChange={(event) => updateForm({ rate: event.target.value })} placeholder="Rate" />
            <div className="inventory-value-box">{formatCurrency(Number(form.quantity || 0) * Number(form.rate || 0))}</div>
          </div>
          <textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} placeholder="Warehouse notes, batch, transport, or sales dispatch details" />
        </section>
        <aside className="inventory-panel inventory-side-summary">
          <p>{selected?.itemName || "Selected item"}</p>
          <h3>{selected ? `${selected.quantity} units available` : "Choose an item"}</h3>
          <span>{isPurchase ? "This entry will increase stock." : "This entry will reduce available stock."}</span>
          {!isPurchase && selected && Number(form.quantity || 0) > Number(selected.quantity || 0) ? (
            <b className="inventory-danger-text">Quantity exceeds available stock.</b>
          ) : null}
          <button type="submit">{isPurchase ? "Post Entry" : "Finalize Entry"}</button>
        </aside>
      </div>
    </form>
  );
}

function StockList({ stockItems, onNavigate }) {
  const [query, setQuery] = useState("");
  const filtered = stockItems.filter((row) =>
    `${row.itemName} ${row.sku} ${row.category} ${row.warehouse}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="inventory-workspace">
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory / Stock</p>
          <h1>Stock List Page</h1>
          <span>Searchable ledger of every item with available quantity, reserved stock, value, and status.</span>
        </div>
        <button type="button" className="inventory-light-btn"><FaDownload /> Export Ledger</button>
      </div>
      <label className="inventory-search">
        <FaSearch />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory items, SKU, warehouse..." />
      </label>
      <section className="inventory-panel">
        <StockTable rows={filtered} onView={(id) => onNavigate("stock-detail", id)} showAdjust onAdjust={(id) => onNavigate("stock-adjustment", id)} />
      </section>
    </div>
  );
}

function StockDetail({ item, movements, onBack, onAdjust }) {
  if (!item) {
    return (
      <div className="inventory-panel">
        <p className="muted">No stock item selected.</p>
        <button type="button" onClick={onBack}>Back to Stock List</button>
      </div>
    );
  }
  const itemMovements = movements.filter((movement) => movement.itemId === item.id || movement.sku === item.sku);

  return (
    <div className="inventory-workspace">
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory / Stock Detail</p>
          <h1>Stock Detail Page</h1>
          <span>Deep view of item quantity, valuation, warehouse split, and movement ledger.</span>
        </div>
        <div className="inventory-head-actions">
          <button type="button" className="inventory-light-btn" onClick={onBack}>Back</button>
          <button type="button" onClick={() => onAdjust(item.id)}>Adjust Stock</button>
        </div>
      </div>
      <div className="inventory-detail-grid">
        <section className="inventory-panel inventory-detail-hero">
          <span className="inventory-chip">{item.category}</span>
          <h2>{item.itemName}</h2>
          <p>{item.sku || "No SKU"} / {item.warehouse}</p>
          <div className="inventory-detail-kpis">
            <div><strong>{Number(item.quantity || 0).toLocaleString("en-IN")}</strong><span>Current Stock</span></div>
            <div><strong>{formatCurrency(stockValue(item))}</strong><span>Inventory Value</span></div>
            <div><strong>{formatCurrency(item.rate)}</strong><span>Weighted Rate</span></div>
          </div>
        </section>
        <aside className="inventory-panel">
          <p>Stock Status</p>
          <h3>{Number(item.quantity || 0) <= 10 ? "Low Stock" : "Healthy"}</h3>
          <span className={Number(item.quantity || 0) <= 10 ? "inventory-chip danger" : "inventory-chip healthy"}>
            {Number(item.quantity || 0) <= 10 ? "Reorder Suggested" : "Stock Healthy"}
          </span>
        </aside>
      </div>
      <section className="inventory-panel">
        <div className="inventory-section-head">
          <div>
            <p>Movement History</p>
            <h3>Item Ledger</h3>
          </div>
        </div>
        <MovementTable movements={itemMovements} />
      </section>
    </div>
  );
}

function StockAdjustment({ stockItems, selectedId, onSave, onCancel }) {
  const [form, setForm] = useState({ ...emptyAdjustment, itemId: selectedId || "" });
  const item = stockItems.find((row) => row.id === form.itemId);
  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <form className="inventory-workspace" onSubmit={handleSubmit}>
      <div className="inventory-head">
        <div>
          <p className="inventory-breadcrumb">Inventory / Stock Adjustment</p>
          <h1>Stock Adjustment Page</h1>
          <span>Rectify inventory levels for damage, loss, manual correction, or stock discovery.</span>
        </div>
        <button type="button" className="inventory-light-btn" onClick={onCancel}>Cancel</button>
      </div>
      <div className="inventory-movement-grid">
        <section className="inventory-panel">
          <div className="inventory-adjust-type">
            {["Positive Adjustment", "Negative Adjustment"].map((type) => (
              <button
                type="button"
                key={type}
                className={form.type === type ? "active" : ""}
                onClick={() => updateForm({ type })}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="form-grid-2">
            <select value={form.itemId} onChange={(event) => updateForm({ itemId: event.target.value })} required>
              <option value="">Select item</option>
              {stockItems.map((row) => <option key={row.id} value={row.id}>{row.itemName} - {row.sku}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(event) => updateForm({ date: event.target.value })} />
            <input type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => updateForm({ quantity: event.target.value })} placeholder="Quantity to adjust" />
            <input type="number" min="0" step="0.01" value={form.rate} onChange={(event) => updateForm({ rate: event.target.value })} placeholder="Value per unit" />
          </div>
          <select value={form.reason} onChange={(event) => updateForm({ reason: event.target.value })}>
            <option>Manual correction</option>
            <option>Damaged goods</option>
            <option>Lost stock</option>
            <option>Found stock</option>
            <option>Opening audit difference</option>
          </select>
          <textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} placeholder="Additional note or specific details regarding this adjustment" />
        </section>
        <aside className="inventory-panel inventory-side-summary">
          <p>Real-time Impact</p>
          <h3>{item?.itemName || "Select item"}</h3>
          <span>Current: {item?.quantity || 0} units</span>
          <span>Adjustment: {form.type === "Negative Adjustment" ? "-" : "+"}{form.quantity || 0} units</span>
          <button type="submit">Post Adjustment</button>
        </aside>
      </div>
    </form>
  );
}

function StockTable({ rows, onView, showAdjust = false, onAdjust }) {
  return (
    <div className="inventory-table">
      <div className="inventory-table-head">
        <span>Item Name</span>
        <span>Warehouse</span>
        <span>Qty</span>
        <span>Rate</span>
        <span>Total Value</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {rows.map((row) => (
        <div className="inventory-table-row" key={row.id}>
          <strong>{row.itemName}<small>{row.sku || "No SKU"} / {row.category}</small></strong>
          <span>{row.warehouse}</span>
          <span>{Number(row.quantity || 0).toLocaleString("en-IN")}</span>
          <span>{formatCurrency(row.rate)}</span>
          <span>{formatCurrency(stockValue(row))}</span>
          <span className={Number(row.quantity || 0) <= 10 ? "inventory-chip danger" : "inventory-chip healthy"}>
            {Number(row.quantity || 0) <= 10 ? "Low Stock" : "Healthy"}
          </span>
          <span className="inventory-row-actions">
            <button type="button" title="Detail" onClick={() => onView(row.id)}><FaEye /></button>
            {showAdjust ? <button type="button" title="Adjust" onClick={() => onAdjust(row.id)}><FaEdit /></button> : null}
          </span>
        </div>
      ))}
      {rows.length === 0 ? <p className="inventory-empty">No stock records found.</p> : null}
    </div>
  );
}

function MovementTable({ movements }) {
  return (
    <div className="inventory-table compact">
      <div className="inventory-table-head">
        <span>Date</span>
        <span>Item</span>
        <span>Reference</span>
        <span>Type</span>
        <span>Qty</span>
        <span>Value</span>
        <span>Party</span>
      </div>
      {movements.map((movement) => (
        <div className="inventory-table-row" key={movement.id}>
          <span>{movement.date}</span>
          <strong>{movement.itemName}<small>{movement.sku || "-"}</small></strong>
          <span>{movement.referenceNo || "-"}</span>
          <span className={movement.mode === "sales" || movement.mode === "adjust-negative" ? "inventory-chip danger" : "inventory-chip healthy"}>
            {movement.mode}
          </span>
          <span>{movement.quantity}</span>
          <span>{formatCurrency(Number(movement.quantity || 0) * Number(movement.rate || 0))}</span>
          <span>{movement.partyName || movement.reason || "-"}</span>
        </div>
      ))}
      {movements.length === 0 ? <p className="inventory-empty">No stock movement has been posted yet.</p> : null}
    </div>
  );
}

export default function Inventory({ activePage: appActivePage, onChangePage, user }) {
  const products = useSelector((state) => state.product.items);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    if (!user?.id) {
      setRecords([]);
      return;
    }
    setRecords(readRecords(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (appActivePage?.startsWith("inventory-")) {
      setPage(appActivePage.replace("inventory-", ""));
      setSelectedId(null);
    } else if (appActivePage === "inventory") {
      setPage("dashboard");
    }
  }, [appActivePage]);

  const stockItems = useMemo(() => {
    const opening = records.filter((record) => record.kind === "stock");
    return opening.length ? opening : getInitialStock(products);
  }, [records, products]);

  const movements = useMemo(() => records.filter((record) => record.kind === "movement"), [records]);
  const selectedItem = stockItems.find((row) => row.id === selectedId) || null;

  const persist = (nextRecords) => {
    setRecords(nextRecords);
    if (user?.id) writeRecords(user.id, nextRecords);
  };

  const navigate = (nextPage, id = null) => {
    setPage(nextPage);
    setSelectedId(id);
    if (onChangePage) onChangePage(nextPage === "dashboard" ? "inventory" : `inventory-${nextPage}`);
  };

  const saveOpening = (payload) => {
    const record = {
      ...payload,
      id: `stock-${Date.now()}`,
      kind: "stock",
      quantity: Number(payload.quantity || 0),
      rate: Number(payload.rate || 0),
      createdAt: new Date().toISOString(),
    };
    persist([record, ...records]);
    navigate("opening-list");
  };

  const upsertStockForMovement = (movement) => {
    const existing = stockItems.find((row) => row.id === movement.itemId || row.sku === movement.sku);
    const multiplier = movement.mode === "sales" ? -1 : 1;
    if (!existing) return records;

    const persistedExisting = records.some((record) => record.id === existing.id);
    if (!persistedExisting) {
      return [
        {
          ...existing,
          kind: "stock",
          source: "catalogue",
          quantity: Math.max(0, Number(existing.quantity || 0) + multiplier * Number(movement.quantity || 0)),
          rate: Number(movement.rate || existing.rate || 0),
          createdAt: new Date().toISOString(),
        },
        ...records,
      ];
    }

    return records.map((record) =>
      record.id === existing.id
        ? { ...record, quantity: Math.max(0, Number(record.quantity || 0) + multiplier * Number(movement.quantity || 0)), rate: Number(movement.rate || record.rate || 0) }
        : record,
    );
  };

  const saveMovement = (payload) => {
    const movement = {
      ...payload,
      id: `move-${Date.now()}`,
      kind: "movement",
      quantity: Number(payload.quantity || 0),
      rate: Number(payload.rate || 0),
      createdAt: new Date().toISOString(),
    };
    persist([movement, ...upsertStockForMovement(movement)]);
    navigate("stock-list");
  };

  const saveAdjustment = (payload) => {
    const item = stockItems.find((row) => row.id === payload.itemId);
    const isNegative = payload.type === "Negative Adjustment";
    const quantity = Number(payload.quantity || 0);
    const movement = {
      ...payload,
      id: `adjust-${Date.now()}`,
      kind: "movement",
      mode: isNegative ? "adjust-negative" : "adjust-positive",
      itemName: item?.itemName || "Inventory Item",
      sku: item?.sku || "",
      warehouse: item?.warehouse || "Main Store",
      partyName: "",
      referenceNo: payload.reason,
      quantity,
      rate: Number(payload.rate || item?.rate || 0),
      createdAt: new Date().toISOString(),
    };
    const nextRecords = records.map((record) =>
      record.id === payload.itemId
        ? { ...record, quantity: Math.max(0, Number(record.quantity || 0) + (isNegative ? -quantity : quantity)), rate: Number(payload.rate || record.rate || 0) }
        : record,
    );
    persist([movement, ...nextRecords]);
    navigate("stock-detail", payload.itemId);
  };

  const pages = {
    dashboard: <InventoryDashboard stockItems={stockItems} movements={movements} onNavigate={navigate} />,
    "opening-main": <OpeningStockMain stockItems={stockItems} onNavigate={navigate} />,
    "opening-add": <OpeningStockForm onSave={saveOpening} onCancel={() => navigate("opening-main")} />,
    "opening-list": <OpeningStockList stockItems={stockItems} onNavigate={navigate} />,
    "purchase-entry": <MovementForm mode="purchase" stockItems={stockItems} onSave={saveMovement} onCancel={() => navigate("dashboard")} />,
    "sales-entry": <MovementForm mode="sales" stockItems={stockItems} onSave={saveMovement} onCancel={() => navigate("dashboard")} />,
    "stock-list": <StockList stockItems={stockItems} onNavigate={navigate} />,
    "stock-detail": <StockDetail item={selectedItem} movements={movements} onBack={() => navigate("stock-list")} onAdjust={(id) => navigate("stock-adjustment", id)} />,
    "stock-adjustment": <StockAdjustment stockItems={stockItems} selectedId={selectedId} onSave={saveAdjustment} onCancel={() => navigate("stock-list")} />,
  };

  return pages[page] || pages.dashboard;
}
