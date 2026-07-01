import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaEdit,
  FaEye,
  FaFileAlt,
  FaFileInvoiceDollar,
  FaList,
  FaPlus,
  FaPrint,
  FaSearch,
  FaShoppingCart,
  FaUniversity,
  FaUsers,
} from "react-icons/fa";
import { formatCurrency } from "../utils/formatCurrency";

const SALES_STORAGE_KEY = "billing:sales-documents";

const documentTypes = [
  {
    id: "quotation",
    title: "Quotation",
    shortCode: "QT",
    accent: "#0d9488",
    pages: ["main", "create", "list", "detail"],
  },
  {
    id: "taxInvoice",
    title: "Tax Invoice",
    shortCode: "TI",
    accent: "#2563eb",
    pages: ["main", "create", "list", "detail", "edit", "print"],
  },
  {
    id: "creditNote",
    title: "Credit Note",
    shortCode: "CN",
    accent: "#7c3aed",
    pages: ["main", "create", "list", "detail"],
  },
  {
    id: "debitNote",
    title: "Debit Note",
    shortCode: "DN",
    accent: "#c2410c",
    pages: ["main", "create", "list", "detail"],
  },
  {
    id: "dummyInvoice",
    title: "Dummy Invoice",
    shortCode: "DI",
    accent: "#0f766e",
    pages: ["main", "create", "list", "detail"],
  },
];

const emptyLine = {
  description: "",
  quantity: 1,
  rate: 0,
};

const emptyForm = {
  customerId: "",
  customerName: "",
  docDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  referenceNo: "",
  gstPercent: 18,
  notes: "",
  lines: [{ ...emptyLine }],
};

const readDocuments = () => {
  try {
    return JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeDocuments = (documents) => {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(documents));
};

const makeDocumentNo = (type, documents) => {
  const count = documents.filter((document) => document.typeId === type.id).length + 1;
  return `${type.shortCode}-${String(count).padStart(4, "0")}`;
};

const calculateTotals = (lines, gstPercent) => {
  const normalizedLines = lines.map((line) => {
    const quantity = Number(line.quantity || 0);
    const rate = Number(line.rate || 0);
    return {
      ...line,
      quantity,
      rate,
      total: quantity * rate,
    };
  });
  const subtotal = normalizedLines.reduce((sum, line) => sum + line.total, 0);
  const tax = (subtotal * Number(gstPercent || 0)) / 100;
  return {
    lines: normalizedLines,
    subtotal,
    tax,
    grandTotal: subtotal + tax,
  };
};

const getCustomerName = (customers, customerId, fallback) => {
  const customer = customers.find((item) => String(item.id) === String(customerId));
  return customer?.name || fallback || "Walk-in Customer";
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "WC";

function SalesMain({ type, documents, onOpenPage }) {
  const typeDocuments = documents.filter((document) => document.typeId === type.id);
  const totalAmount = typeDocuments.reduce((sum, document) => sum + Number(document.grandTotal || 0), 0);
  const pendingDocuments = typeDocuments.filter((document) => document.status === "Draft").length;
  const topCustomers = Object.values(
    typeDocuments.reduce((map, document) => {
      const key = document.customerName || "Walk-in Customer";
      map[key] = map[key] || { name: key, total: 0, count: 0 };
      map[key].total += Number(document.grandTotal || 0);
      map[key].count += 1;
      return map;
    }, {}),
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
  const recentDocuments = typeDocuments.slice(0, 5);
  const chartValues = [38, 56, 44, 72, 61, 84];

  return (
    <div className="sales-page-grid sales-ledger-dashboard">
      <div className="sales-intel-head">
        <div>
          <h3>Sales Intelligence</h3>
          <p>Real-time performance metrics for your digital atelier.</p>
        </div>
        <div className="sales-hero-actions">
          <button type="button" className="sales-secondary-btn">
            Download CSV
          </button>
          <button type="button" onClick={() => onOpenPage("list")}>
            Export Report
          </button>
        </div>
      </div>

      <div className="sales-ledger-stats">
        <div className="panel sales-stat-card">
          <div className="sales-stat-top">
            <span className="sales-stat-icon blue"><FaFileInvoiceDollar /></span>
            <strong>+12.5%</strong>
          </div>
          <p>Monthly Sales</p>
          <h2>{formatCurrency(totalAmount)}</h2>
        </div>
        <div className="panel sales-stat-card">
          <div className="sales-stat-top">
            <span className="sales-stat-icon violet"><FaUniversity /></span>
            <strong>Stable</strong>
          </div>
          <p>Total Revenue</p>
          <h2>{formatCurrency(totalAmount)}</h2>
        </div>
        <div className="panel sales-stat-card">
          <div className="sales-stat-top">
            <span className="sales-stat-icon red"><FaFileAlt /></span>
            <strong>Urgent</strong>
          </div>
          <p>Pending Invoices</p>
          <h2>{pendingDocuments || typeDocuments.length}</h2>
        </div>
        <div className="panel sales-stat-card">
          <div className="sales-stat-top">
            <span className="sales-stat-icon warm"><FaUsers /></span>
            <strong>Active</strong>
          </div>
          <p>Top Customers</p>
          <h2>{topCustomers.length}</h2>
        </div>
      </div>

      <div className="sales-insight-grid">
        <div className="panel sales-chart-card">
          <div className="sales-section-head">
            <div>
              <h3>Revenue Stream</h3>
              <p className="muted">Performance across the last 6 months</p>
            </div>
            <span className="sales-pill">Last 6 Months</span>
          </div>
          <div className="sales-bar-chart">
            {chartValues.map((value, index) => (
              <div className="sales-bar-item" key={index}>
                <span style={{ height: `${value}%` }} className={index === 3 ? "active" : ""} />
                <small>{["JAN", "FEB", "MAR", "APR", "MAY", "JUN"][index]}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel sales-top-customers">
          <h3>Top Customers</h3>
          <div className="sales-customer-list">
            {(topCustomers.length
              ? topCustomers
              : [{ name: "No customers yet", total: 0, count: 0 }]
            ).map((customer, index) => (
              <div className="sales-customer-row" key={`${customer.name}-${index}`}>
                <span className={`sales-avatar tone-${index + 1}`}>{getInitials(customer.name)}</span>
                <div>
                  <strong>{customer.name}</strong>
                  <small>{customer.count} document{customer.count === 1 ? "" : "s"}</small>
                </div>
                <b>{formatCurrency(customer.total)}</b>
              </div>
            ))}
          </div>
          <button type="button" className="sales-link-btn" onClick={() => onOpenPage("list")}>View All Clients</button>
        </div>
      </div>

      <div className="panel sales-recent-card">
        <div className="sales-section-head">
          <h3>Recent Transactions</h3>
          <div className="sales-mini-tabs">
            <button type="button">All</button>
            <button type="button">Paid</button>
            <button type="button">Pending</button>
          </div>
        </div>
        <div className="sales-table">
          <div className="sales-table-head">
            <span>Customer</span>
            <span>Date</span>
            <span>Status</span>
            <span>Amount</span>
            <span></span>
          </div>
          {recentDocuments.map((document) => (
            <div className="sales-table-row" key={document.id}>
              <strong>{document.customerName}</strong>
              <span>{document.docDate}</span>
              <span className="sales-status paid">{document.status || "Draft"}</span>
              <span>{formatCurrency(document.grandTotal)}</span>
              <button type="button" className="sales-icon-btn" title="Detail" onClick={() => onOpenPage("detail")}><FaEye /></button>
            </div>
          ))}
          {recentDocuments.length === 0 ? (
            <div className="sales-empty-state">
              <p className="muted">No transactions yet.</p>
              <button type="button" onClick={() => onOpenPage("create")}><FaPlus /> New Transaction</button>
            </div>
          ) : null}
        </div>
        {recentDocuments.length ? <button type="button" className="sales-link-btn" onClick={() => onOpenPage("list")}>View All Transactions</button> : null}
      </div>

      <div className="panel sales-main-actions">
        <div>
          <p className="muted">Document Pages</p>
          <h3>{type.title}</h3>
        </div>
        <div className="sales-action-grid">
          {type.pages
            .filter((page) => page !== "main")
            .map((page) => (
              <button type="button" key={page} className="sales-action-tile" onClick={() => onOpenPage(page)}>
                {page === "create" ? <FaPlus /> : page === "list" ? <FaList /> : page === "print" ? <FaPrint /> : page === "edit" ? <FaEdit /> : <FaEye />}
                <span>{page.charAt(0).toUpperCase() + page.slice(1)}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function SalesModuleRail({ activeTypeId, activePage, onChangeType, onOpenPage }) {
  const railLinks = [
    { id: "quotation", label: "Quotation", icon: <FaFileAlt /> },
    { id: "taxInvoice", label: "Tax Invoice", icon: <FaFileInvoiceDollar /> },
    { id: "creditNote", label: "Credit Note", icon: <FaUniversity /> },
    { id: "debitNote", label: "Debit Note", icon: <FaShoppingCart /> },
    { id: "dummyInvoice", label: "Dummy Invoice", icon: <FaFileAlt /> },
  ];

  return (
    <aside className="sales-ledger-rail">
      <div className="sales-ledger-brand">
        <strong>Fluent Ledger</strong>
        <span>The Precision Atelier</span>
      </div>
      <nav className="sales-ledger-nav">
        {railLinks.map((link) => (
          <button
            type="button"
            key={link.id}
            className={activeTypeId === link.id ? "active" : ""}
            onClick={() => onChangeType(link.id)}
          >
            {link.icon}
            <span>{link.label}</span>
          </button>
        ))}
      </nav>
      <button type="button" className="sales-new-transaction" onClick={() => onOpenPage("create")}>
        <FaPlus /> New Transaction
      </button>
      <div className="sales-profile-chip">
        <span>AS</span>
        <div>
          <strong>Artisanal Shop</strong>
          <small>{activePage.charAt(0).toUpperCase() + activePage.slice(1)} Profile</small>
        </div>
      </div>
    </aside>
  );
}

function SalesTopbar({ activeType, activePage, onOpenPage }) {
  return (
    <div className="sales-ledger-topbar">
      <label className="sales-search">
        <FaSearch />
        <input placeholder="Search sales, clients, or invoices..." />
      </label>
      <div className="sales-topbar-actions">
        <button type="button" className={activePage === "main" ? "active" : ""} onClick={() => onOpenPage("main")}>Dashboard</button>
        <button type="button" onClick={() => onOpenPage("create")}>Create {activeType.title}</button>
      </div>
    </div>
  );
}

function SalesForm({ type, customers, products, document, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (!document) return emptyForm;
    return {
      customerId: document.customerId || "",
      customerName: document.customerName || "",
      docDate: document.docDate || emptyForm.docDate,
      dueDate: document.dueDate || "",
      referenceNo: document.referenceNo || "",
      gstPercent: document.gstPercent ?? 18,
      notes: document.notes || "",
      lines: document.lines?.length ? document.lines : [{ ...emptyLine }],
    };
  });

  const totals = useMemo(() => calculateTotals(form.lines, form.gstPercent), [form.lines, form.gstPercent]);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const updateLine = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    }));
  };

  const selectProduct = (index, productId) => {
    const selected = products.find((product) => String(product.id) === productId);
    updateLine(index, {
      description: selected?.name || "",
      rate: selected?.pricePerMeter || 0,
    });
  };

  const addLine = () => updateForm({ lines: [...form.lines, { ...emptyLine }] });
  const removeLine = (index) => {
    const nextLines = form.lines.filter((_, lineIndex) => lineIndex !== index);
    updateForm({ lines: nextLines.length ? nextLines : [{ ...emptyLine }] });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      customerName: getCustomerName(customers, form.customerId, form.customerName),
      lines: totals.lines.filter((line) => line.description || line.quantity || line.rate),
      subtotal: totals.subtotal,
      tax: totals.tax,
      grandTotal: totals.grandTotal,
      status: document?.status || "Draft",
    });
  };

  return (
    <form className="sales-form" onSubmit={handleSubmit}>
      <div className="panel">
        <div className="sales-section-head">
          <div>
            <p className="muted">{document ? "Edit" : "Create"} {type.title} Page</p>
            <h3>{document?.documentNo || "New Document"}</h3>
          </div>
          <button type="button" className="sales-secondary-btn" onClick={onCancel}>
            Back
          </button>
        </div>
        <div className="form-grid-4 sales-form-grid">
          <select value={form.customerId} onChange={(event) => updateForm({ customerId: event.target.value })}>
            <option value="">Walk-in Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          <input
            value={form.customerName}
            onChange={(event) => updateForm({ customerName: event.target.value })}
            placeholder="Manual customer name"
          />
          <input type="date" value={form.docDate} onChange={(event) => updateForm({ docDate: event.target.value })} />
          <input type="date" value={form.dueDate} onChange={(event) => updateForm({ dueDate: event.target.value })} />
          <input
            value={form.referenceNo}
            onChange={(event) => updateForm({ referenceNo: event.target.value })}
            placeholder="Reference No"
          />
          <input
            type="number"
            min="0"
            value={form.gstPercent}
            onChange={(event) => updateForm({ gstPercent: event.target.value })}
            placeholder="GST %"
          />
        </div>
      </div>

      <div className="panel sales-lines-panel">
        <div className="sales-section-head">
          <h3>Line Items</h3>
          <button type="button" onClick={addLine}>
            <FaPlus /> Add Item
          </button>
        </div>
        {form.lines.map((line, index) => (
          <div className="sales-line-row" key={index}>
            <select defaultValue="" onChange={(event) => selectProduct(index, event.target.value)}>
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <input
              value={line.description}
              onChange={(event) => updateLine(index, { description: event.target.value })}
              placeholder="Description"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.quantity}
              onChange={(event) => updateLine(index, { quantity: event.target.value })}
              placeholder="Qty"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.rate}
              onChange={(event) => updateLine(index, { rate: event.target.value })}
              placeholder="Rate"
            />
            <div className="value-box">{formatCurrency(Number(line.quantity || 0) * Number(line.rate || 0))}</div>
            <button type="button" className="danger" onClick={() => removeLine(index)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="panel sales-total-panel">
        <textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} placeholder="Terms, notes or reason" />
        <div className="summary sales-summary">
          <p>Subtotal <strong>{formatCurrency(totals.subtotal)}</strong></p>
          <p>GST <strong>{formatCurrency(totals.tax)}</strong></p>
          <p>Total <strong>{formatCurrency(totals.grandTotal)}</strong></p>
        </div>
        <button type="submit">{document ? "Update" : "Save"} {type.title}</button>
      </div>
    </form>
  );
}

function SalesList({ type, documents, onView, onEdit, onPrint, onCreate }) {
  const typeDocuments = documents.filter((document) => document.typeId === type.id);

  return (
    <div className="panel sales-list-panel">
      <div className="sales-section-head">
        <div>
          <p className="muted">{type.title} List Page</p>
          <h3>{typeDocuments.length} Document{typeDocuments.length === 1 ? "" : "s"}</h3>
        </div>
        <button type="button" onClick={onCreate}>
          <FaPlus /> Create
        </button>
      </div>
      <div className="sales-table">
        <div className="sales-table-head">
          <span>No</span>
          <span>Customer</span>
          <span>Date</span>
          <span>Total</span>
          <span>Actions</span>
        </div>
        {typeDocuments.map((document) => (
          <div className="sales-table-row" key={document.id}>
            <strong>{document.documentNo}</strong>
            <span>{document.customerName}</span>
            <span>{document.docDate}</span>
            <span>{formatCurrency(document.grandTotal)}</span>
            <div className="sales-row-actions">
              <button type="button" className="sales-icon-btn" title="Detail" onClick={() => onView(document.id)}><FaEye /></button>
              {type.id === "taxInvoice" ? (
                <>
                  <button type="button" className="sales-icon-btn" title="Edit" onClick={() => onEdit(document.id)}><FaEdit /></button>
                  <button type="button" className="sales-icon-btn" title="Print" onClick={() => onPrint(document.id)}><FaPrint /></button>
                </>
              ) : null}
            </div>
          </div>
        ))}
        {typeDocuments.length === 0 ? <p className="muted">No {type.title.toLowerCase()} records yet.</p> : null}
      </div>
    </div>
  );
}

function SalesDetail({ type, document, mode, onBack, onEdit }) {
  if (!document) {
    return (
      <div className="panel">
        <p className="muted">No {type.title.toLowerCase()} selected.</p>
        <button type="button" onClick={onBack}>Back to List</button>
      </div>
    );
  }

  const isPrint = mode === "print";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={isPrint ? "sales-print-workspace" : "stack"}>
      <div className="panel sales-section-head sales-no-print">
        <div>
          <p className="muted">{type.title} {isPrint ? "Print" : "Detail"} Page</p>
          <h3>{document.documentNo}</h3>
        </div>
        <div className="sales-detail-actions">
          <button type="button" className="sales-secondary-btn" onClick={onBack}>Back</button>
          {type.id === "taxInvoice" && !isPrint ? (
            <button type="button" onClick={() => onEdit(document.id)}><FaEdit /> Edit</button>
          ) : null}
          {type.id === "taxInvoice" ? (
            <button type="button" onClick={handlePrint}><FaPrint /> Print</button>
          ) : null}
        </div>
      </div>

      <div className="panel sales-document-sheet" style={{ borderTopColor: type.accent }}>
        <div className="sales-document-header">
          <div>
            <p className="muted">{type.title}</p>
            <h2>{document.documentNo}</h2>
          </div>
          <div>
            <p><strong>Date:</strong> {document.docDate || "-"}</p>
            <p><strong>Due:</strong> {document.dueDate || "-"}</p>
            <p><strong>Ref:</strong> {document.referenceNo || "-"}</p>
          </div>
        </div>

        <div className="sales-party-box">
          <p className="muted">Customer</p>
          <h3>{document.customerName}</h3>
        </div>

        <table className="sales-document-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(document.lines || []).map((line, index) => (
              <tr key={`${document.id}-${index}`}>
                <td>{line.description || "-"}</td>
                <td>{line.quantity}</td>
                <td>{formatCurrency(line.rate)}</td>
                <td>{formatCurrency(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sales-document-footer">
          <div>
            <p className="muted">Notes</p>
            <p>{document.notes || "-"}</p>
          </div>
          <div className="sales-document-totals">
            <p><span>Subtotal</span><strong>{formatCurrency(document.subtotal)}</strong></p>
            <p><span>GST</span><strong>{formatCurrency(document.tax)}</strong></p>
            <p><span>Total</span><strong>{formatCurrency(document.grandTotal)}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sales() {
  const customers = useSelector((state) => state.customer.items);
  const products = useSelector((state) => state.product.items);
  const [activeTypeId, setActiveTypeId] = useState("quotation");
  const [activePage, setActivePage] = useState("main");
  const [selectedId, setSelectedId] = useState(null);
  const [documents, setDocuments] = useState(readDocuments);

  const activeType = documentTypes.find((type) => type.id === activeTypeId) || documentTypes[0];
  const selectedDocument = documents.find((document) => document.id === selectedId) || null;

  const persistDocuments = (nextDocuments) => {
    setDocuments(nextDocuments);
    writeDocuments(nextDocuments);
  };

  const changeType = (typeId) => {
    setActiveTypeId(typeId);
    setActivePage("main");
    setSelectedId(null);
  };

  const openPage = (page) => {
    setActivePage(page);
    if (page === "detail" || page === "edit" || page === "print") {
      const latest = documents.find((document) => document.typeId === activeType.id);
      setSelectedId((current) => current || latest?.id || null);
    } else {
      setSelectedId(null);
    }
  };

  const saveDocument = (payload) => {
    if (selectedDocument && activePage === "edit") {
      const nextDocuments = documents.map((document) =>
        document.id === selectedDocument.id
          ? { ...document, ...payload, updatedAt: new Date().toISOString() }
          : document,
      );
      persistDocuments(nextDocuments);
      setActivePage("detail");
      return;
    }

    const document = {
      ...payload,
      id: `${activeType.id}-${Date.now()}`,
      typeId: activeType.id,
      typeTitle: activeType.title,
      documentNo: makeDocumentNo(activeType, documents),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistDocuments([document, ...documents]);
    setSelectedId(document.id);
    setActivePage("detail");
  };

  const viewDocument = (id) => {
    setSelectedId(id);
    setActivePage("detail");
  };

  const editDocument = (id) => {
    setSelectedId(id);
    setActivePage("edit");
  };

  const printDocument = (id) => {
    setSelectedId(id);
    setActivePage("print");
  };

  return (
    <section className="sales-workspace sales-ledger-shell">
      <SalesModuleRail
        activeTypeId={activeTypeId}
        activePage={activePage}
        onChangeType={changeType}
        onOpenPage={openPage}
      />
      <div className="sales-ledger-content">
        <SalesTopbar activeType={activeType} activePage={activePage} onOpenPage={openPage} />

        <div className="sales-page-tabs">
          {activeType.pages.map((page) => (
            <button
              type="button"
              key={page}
              className={page === activePage ? "sales-page-tab active" : "sales-page-tab"}
              onClick={() => openPage(page)}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
        </div>

        {activePage === "main" ? (
          <SalesMain type={activeType} documents={documents} onOpenPage={openPage} />
        ) : null}

        {activePage === "create" ? (
          <SalesForm
            type={activeType}
            customers={customers}
            products={products}
            onSave={saveDocument}
            onCancel={() => setActivePage("main")}
          />
        ) : null}

        {activePage === "list" ? (
          <SalesList
            type={activeType}
            documents={documents}
            onView={viewDocument}
            onEdit={editDocument}
            onPrint={printDocument}
            onCreate={() => setActivePage("create")}
          />
        ) : null}

        {activePage === "detail" ? (
          <SalesDetail
            type={activeType}
            document={selectedDocument}
            onBack={() => setActivePage("list")}
            onEdit={editDocument}
          />
        ) : null}

        {activePage === "edit" ? (
          activeType.id === "taxInvoice" ? (
            <SalesForm
              type={activeType}
              customers={customers}
              products={products}
              document={selectedDocument}
              onSave={saveDocument}
              onCancel={() => setActivePage("detail")}
            />
          ) : (
            <SalesDetail type={activeType} document={selectedDocument} onBack={() => setActivePage("list")} />
          )
        ) : null}

        {activePage === "print" ? (
          <SalesDetail
            type={activeType}
            document={selectedDocument}
            mode="print"
            onBack={() => setActivePage("list")}
            onEdit={editDocument}
          />
        ) : null}
      </div>
    </section>
  );
}
