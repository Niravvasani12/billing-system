import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaArrowRight,
  FaBoxes,
  FaDownload,
  FaEye,
  FaFileInvoiceDollar,
  FaFilter,
  FaList,
  FaPlus,
  FaReceipt,
  FaSave,
  FaTruck,
  FaUndoAlt,
  FaUniversity,
} from "react-icons/fa";
import { formatCurrency } from "../utils/formatCurrency";

const documentTypes = [
  {
    id: "invoice",
    title: "Purchase Invoice",
    pluralTitle: "Purchase Invoices",
    shortCode: "PUR",
    accent: "#1266a8",
    helper: "Manage incoming vendor bills, operational expenditure, and payable status.",
  },
  {
    id: "creditNote",
    title: "Purchase Credit Note",
    pluralTitle: "Purchase Credit Notes",
    shortCode: "PCN",
    accent: "#2563eb",
    helper: "Manage returns, supplier adjustments, and inventory credit confirmations.",
  },
  {
    id: "debitNote",
    title: "Purchase Debit Note",
    pluralTitle: "Purchase Debit Notes",
    shortCode: "PDN",
    accent: "#7c3aed",
    helper: "Record supplier debit memos for recoveries, shortages, and price changes.",
  },
  {
    id: "quotation",
    title: "Purchase Quotation",
    pluralTitle: "Purchase Quotations",
    shortCode: "PQT",
    accent: "#0f766e",
    helper: "Track supplier quotes, negotiation status, and future procurement options.",
  },
];

const emptyLine = {
  description: "",
  quantity: 1,
  rate: 0,
  taxPercent: 18,
  reason: "",
};

const getLocalYMD = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyForm = {
  vendorName: "",
  vendorGstin: "",
  vendorAddress: "",
  docDate: getLocalYMD(),
  dueDate: "",
  referenceNo: "",
  paymentStatus: "Pending",
  inventoryStatus: "Pending",
  notes: "",
  lines: [{ ...emptyLine }],
};

const sampleVendors = [
  "Global Tech Solutions",
  "Modern Electronics",
  "Loomis Supply Co.",
  "Northern Logistics Ltd.",
  "Apex Furniture & Decor",
  "Elite Supplies Hub",
  "Reliable Engineering",
  "AK Distributions",
];

const calculateTotals = (lines) => {
  const normalizedLines = lines.map((line) => {
    const quantity = Number(line.quantity || 0);
    const rate = Number(line.rate || 0);
    const taxPercent = Number(line.taxPercent || 0);
    const taxable = quantity * rate;
    const tax = (taxable * taxPercent) / 100;
    return {
      ...line,
      quantity,
      rate,
      taxPercent,
      taxable,
      tax,
      total: taxable + tax,
    };
  });
  const subtotal = normalizedLines.reduce((sum, line) => sum + line.taxable, 0);
  const tax = normalizedLines.reduce((sum, line) => sum + line.tax, 0);
  return {
    lines: normalizedLines,
    subtotal,
    tax,
    grandTotal: subtotal + tax,
  };
};

const makeDocumentNo = (type, documents) => {
  const year = new Date().getFullYear();
  const count = documents.filter((doc) => doc.typeId === type.id).length + 1;
  return `${type.shortCode}-${year}-${String(count).padStart(3, "0")}`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "VN";

const statusClass = (status = "") => status.toLowerCase().replace(/\s+/g, "-");

function PurchaseDashboard({ documents, onNavigate }) {
  const totalPayable = documents
    .filter((doc) => doc.typeId === "invoice")
    .reduce((sum, doc) => sum + Number(doc.grandTotal || 0), 0);
  const creditTotal = documents
    .filter((doc) => doc.typeId === "creditNote")
    .reduce((sum, doc) => sum + Number(doc.grandTotal || 0), 0);
  const openItems = documents.filter((doc) => ["Pending", "Overdue", "Draft"].includes(doc.paymentStatus)).length;
  const recentDocs = [...documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="purchase-workspace">
      <div className="purchase-head">
        <div>
          <p className="purchase-breadcrumb">Purchase</p>
          <h1>Purchase Dashboard</h1>
          <p>Control incoming invoices, supplier notes, quotations, and inventory adjustments.</p>
        </div>
        <button type="button" className="purchase-light-btn" onClick={() => onNavigate("invoice", "create")}>
          <FaPlus /> New Purchase
        </button>
      </div>

      <div className="purchase-kpi-grid">
        <article className="purchase-kpi-card strong">
          <span><FaFileInvoiceDollar /></span>
          <p>Total Payable</p>
          <h2>{formatCurrency(totalPayable)}</h2>
          <small>Vendor obligations this period</small>
        </article>
        <article className="purchase-kpi-card">
          <span><FaUndoAlt /></span>
          <p>Purchase Credit</p>
          <h2>{formatCurrency(creditTotal)}</h2>
          <small>Returns and adjustments logged</small>
        </article>
        <article className="purchase-kpi-card">
          <span><FaBoxes /></span>
          <p>Pending Items</p>
          <h2>{openItems}</h2>
          <small>Need confirmation or settlement</small>
        </article>
        <article className="purchase-kpi-card accent">
          <span><FaUniversity /></span>
          <p>Vendor Reconciliation</p>
          <h2>3</h2>
          <small>Statements require matching</small>
        </article>
      </div>

      <div className="purchase-action-grid">
        {documentTypes.map((type) => (
          <button
            type="button"
            key={type.id}
            className="purchase-action-card"
            style={{ borderLeftColor: type.accent }}
            onClick={() => onNavigate(type.id, "main")}
          >
            <span style={{ color: type.accent }}><FaReceipt /></span>
            <strong>{type.pluralTitle}</strong>
            <small>{type.helper}</small>
            <b>Open <FaArrowRight /></b>
          </button>
        ))}
      </div>

      <div className="purchase-split-grid">
        <section className="purchase-panel">
          <div className="purchase-section-head">
            <div>
              <p>Transaction History</p>
              <h3>Recent Purchase Documents</h3>
            </div>
            <button type="button" className="purchase-link-btn" onClick={() => onNavigate("invoice", "list")}>View Bills</button>
          </div>
          <PurchaseTable documents={recentDocs} compact onView={(doc) => onNavigate(doc.typeId, "detail", doc.id)} />
        </section>
        <aside className="purchase-panel purchase-insight-card">
          <p>Inventory Health Insight</p>
          <h3>Supplier returns are trending lower after quality checks.</h3>
          <div className="purchase-bars">
            <span style={{ width: "52%" }} />
            <span style={{ width: "28%" }} />
            <span style={{ width: "20%" }} />
          </div>
          <button type="button" onClick={() => onNavigate("creditNote", "main")}>Run Supplier Quality Report</button>
        </aside>
      </div>
    </div>
  );
}

function PurchaseMain({ type, documents, onOpenPage }) {
  const typeDocuments = documents.filter((document) => document.typeId === type.id);
  const totalAmount = typeDocuments.reduce((sum, document) => sum + Number(document.grandTotal || 0), 0);
  const pendingCount = typeDocuments.filter((document) => document.paymentStatus !== "Paid").length;
  const latest = typeDocuments[0];

  return (
    <div className="purchase-workspace">
      <div className="purchase-head">
        <div>
          <p className="purchase-breadcrumb">Purchase / {type.pluralTitle}</p>
          <h1>{type.pluralTitle}</h1>
          <p>{type.helper}</p>
        </div>
        <div className="purchase-head-actions">
          <button type="button" className="purchase-light-btn"><FaFilter /> Filter</button>
          <button type="button" className="purchase-light-btn"><FaDownload /> Export</button>
        </div>
      </div>

      <div className="purchase-summary-row">
        <article>
          <small>Total Value</small>
          <strong>{formatCurrency(totalAmount)}</strong>
          <span>+12% vs last month</span>
        </article>
        <article>
          <small>Pending Items</small>
          <strong>{pendingCount} Items</strong>
          <span>Awaiting vendor action</span>
        </article>
        <article className="highlight" style={{ borderColor: `${type.accent}33` }}>
          <small>Active Review</small>
          <strong>{latest?.vendorName || "High-Value Adjustment"}</strong>
          <span>{latest ? formatCurrency(latest.grandTotal) : "No active document yet"}</span>
        </article>
      </div>

      <div className="purchase-action-grid mini">
        <button type="button" className="purchase-action-card" onClick={() => onOpenPage("create")}>
          <span><FaPlus /></span>
          <strong>Create Page</strong>
          <small>Record a new {type.title.toLowerCase()}.</small>
        </button>
        <button type="button" className="purchase-action-card" onClick={() => onOpenPage("list")}>
          <span><FaList /></span>
          <strong>List Page</strong>
          <small>Review all saved supplier documents.</small>
        </button>
        <button type="button" className="purchase-action-card" onClick={() => onOpenPage("detail")}>
          <span><FaEye /></span>
          <strong>Detail Page</strong>
          <small>Open the latest document sheet.</small>
        </button>
      </div>

      <section className="purchase-panel">
        <div className="purchase-section-head">
          <div>
            <p>Recent Records</p>
            <h3>{type.pluralTitle}</h3>
          </div>
          <button type="button" onClick={() => onOpenPage("create")}><FaPlus /> Launch Entry</button>
        </div>
        <PurchaseTable documents={typeDocuments.slice(0, 5)} onView={(doc) => onOpenPage("detail", doc.id)} />
      </section>
    </div>
  );
}

function PurchaseForm({ type, products, document, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (!document) return emptyForm;
    return {
      vendorName: document.vendorName || "",
      vendorGstin: document.vendorGstin || "",
      vendorAddress: document.vendorAddress || "",
      docDate: document.docDate || emptyForm.docDate,
      dueDate: document.dueDate || "",
      referenceNo: document.referenceNo || "",
      paymentStatus: document.paymentStatus || "Pending",
      inventoryStatus: document.inventoryStatus || "Pending",
      notes: document.notes || "",
      lines: document.lines?.length ? document.lines : [{ ...emptyLine }],
    };
  });

  const totals = useMemo(() => calculateTotals(form.lines), [form.lines]);
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
      vendorName: form.vendorName.trim() || "Unregistered Vendor",
      lines: totals.lines.filter((line) => line.description || line.quantity || line.rate),
      subtotal: totals.subtotal,
      tax: totals.tax,
      grandTotal: totals.grandTotal,
    });
  };

  return (
    <form className="purchase-form" onSubmit={handleSubmit}>
      <div className="purchase-head">
        <div>
          <p className="purchase-breadcrumb">Purchase / {type.title}</p>
          <h1>Create {type.title}</h1>
          <p>Capture supplier reference, inventory status, and taxable line items.</p>
        </div>
        <button type="button" className="purchase-light-btn" onClick={onCancel}>Discard Draft</button>
      </div>

      <div className="purchase-form-grid">
        <section className="purchase-panel purchase-step-panel">
          <div className="purchase-step-title">
            <span>01</span>
            <div>
              <h3>Vendor & Reference</h3>
              <p>Select or enter supplier details for this document.</p>
            </div>
          </div>
          <div className="form-grid-4">
            <input list="purchase-vendors" value={form.vendorName} onChange={(event) => updateForm({ vendorName: event.target.value })} placeholder="Vendor name" required />
            <datalist id="purchase-vendors">
              {sampleVendors.map((vendor) => <option key={vendor} value={vendor} />)}
            </datalist>
            <input value={form.vendorGstin} onChange={(event) => updateForm({ vendorGstin: event.target.value })} placeholder="Vendor GSTIN" />
            <input value={form.referenceNo} onChange={(event) => updateForm({ referenceNo: event.target.value })} placeholder="Original bill / reference" />
            <input type="date" value={form.docDate} onChange={(event) => updateForm({ docDate: event.target.value })} />
            <input type="date" value={form.dueDate} onChange={(event) => updateForm({ dueDate: event.target.value })} />
            <select value={form.paymentStatus} onChange={(event) => updateForm({ paymentStatus: event.target.value })}>
              <option>Pending</option>
              <option>Paid</option>
              <option>Partial</option>
              <option>Overdue</option>
              <option>Draft</option>
            </select>
            <select value={form.inventoryStatus} onChange={(event) => updateForm({ inventoryStatus: event.target.value })}>
              <option>Pending</option>
              <option>Received</option>
              <option>Returned</option>
              <option>In Transit</option>
              <option>Rejected</option>
            </select>
          </div>
          <textarea value={form.vendorAddress} onChange={(event) => updateForm({ vendorAddress: event.target.value })} placeholder="Vendor address" />
        </section>

        <aside className="purchase-panel purchase-total-card">
          <p>Credit Summary</p>
          <div><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
          <div><span>GST</span><strong>{formatCurrency(totals.tax)}</strong></div>
          <div className="total"><span>Total</span><strong>{formatCurrency(totals.grandTotal)}</strong></div>
          <textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} placeholder="Internal notes or return reason" />
        </aside>
      </div>

      <section className="purchase-panel purchase-step-panel">
        <div className="purchase-step-title">
          <span>02</span>
          <div>
            <h3>Items Being Recorded</h3>
            <p>Specify quantity, GST, and reason for each stock or service line.</p>
          </div>
          <button type="button" className="purchase-link-btn" onClick={addLine}><FaPlus /> Add Line Item</button>
        </div>
        <div className="purchase-line-head">
          <span>Item Description</span>
          <span>Qty</span>
          <span>Rate</span>
          <span>GST %</span>
          <span>Amount</span>
          <span></span>
        </div>
        {form.lines.map((line, index) => {
          const lineTotal = Number(line.quantity || 0) * Number(line.rate || 0);
          const lineTax = (lineTotal * Number(line.taxPercent || 0)) / 100;
          return (
            <div className="purchase-line-row" key={index}>
              <div>
                <select defaultValue="" onChange={(event) => selectProduct(index, event.target.value)}>
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} placeholder="Description" />
                <input value={line.reason} onChange={(event) => updateLine(index, { reason: event.target.value })} placeholder="Reason / specification" />
              </div>
              <input type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} />
              <input type="number" min="0" step="0.01" value={line.rate} onChange={(event) => updateLine(index, { rate: event.target.value })} />
              <input type="number" min="0" step="0.01" value={line.taxPercent} onChange={(event) => updateLine(index, { taxPercent: event.target.value })} />
              <strong>{formatCurrency(lineTotal + lineTax)}</strong>
              <button type="button" className="danger" onClick={() => removeLine(index)}>Remove</button>
            </div>
          );
        })}
      </section>

      <div className="purchase-form-footer">
        <button type="button" className="purchase-light-btn" onClick={onCancel}>Discard Draft</button>
        <button type="submit"><FaSave /> Save & Update Inventory</button>
      </div>
    </form>
  );
}

function PurchaseTable({ documents, onView, compact = false }) {
  return (
    <div className="purchase-table">
      <div className="purchase-table-head">
        <span>No</span>
        <span>Date</span>
        <span>Vendor</span>
        <span>Amount</span>
        <span>Status</span>
        <span>Action</span>
      </div>
      {documents.map((document) => (
        <div className="purchase-table-row" key={document.id}>
          <strong>{document.documentNo}</strong>
          <span>{document.docDate}</span>
          <span className="purchase-vendor-cell">
            <b>{getInitials(document.vendorName)}</b>
            {document.vendorName}
          </span>
          <span>{formatCurrency(document.grandTotal)}</span>
          <span className={`purchase-status ${statusClass(document.inventoryStatus || document.paymentStatus)}`}>
            {document.inventoryStatus || document.paymentStatus}
          </span>
          <button type="button" className="purchase-icon-btn" title="Detail" onClick={() => onView(document)}>
            <FaEye />
          </button>
        </div>
      ))}
      {documents.length === 0 ? (
        <div className="purchase-empty">
          <p>No purchase documents yet.</p>
          {!compact ? <small>Create one to populate this page.</small> : null}
        </div>
      ) : null}
    </div>
  );
}

function PurchaseList({ type, documents, onView, onCreate }) {
  const typeDocuments = documents.filter((document) => document.typeId === type.id);

  return (
    <div className="purchase-workspace">
      <div className="purchase-head">
        <div>
          <p className="purchase-breadcrumb">Purchase / {type.title}</p>
          <h1>{type.title} List Page</h1>
          <p>Showing {typeDocuments.length} saved supplier document{typeDocuments.length === 1 ? "" : "s"}.</p>
        </div>
        <button type="button" onClick={onCreate}><FaPlus /> Create</button>
      </div>
      <section className="purchase-panel">
        <PurchaseTable documents={typeDocuments} onView={(doc) => onView(doc.id)} />
      </section>
    </div>
  );
}

function PurchaseDetail({ type, document, onBack }) {
  if (!document) {
    return (
      <div className="purchase-panel">
        <p className="muted">No {type.title.toLowerCase()} selected.</p>
        <button type="button" onClick={onBack}>Back to List</button>
      </div>
    );
  }

  return (
    <div className="purchase-detail-grid">
      <section className="purchase-document-sheet">
        <div className="purchase-document-banner">
          <span>{type.title}</span>
          <strong>{document.documentNo}</strong>
          <small>{document.paymentStatus}</small>
        </div>
        <div className="purchase-document-meta">
          <div>
            <p>Supplier Information</p>
            <h3>{document.vendorName}</h3>
            <span>{document.vendorAddress || "Address not provided"}</span>
            <span>GSTIN: {document.vendorGstin || "Unregistered"}</span>
          </div>
          <div>
            <p>Issue Date</p>
            <h3>{document.docDate}</h3>
            <span>Reference: {document.referenceNo || "-"}</span>
            <span>Status: {document.inventoryStatus}</span>
          </div>
        </div>
        <table className="purchase-document-table">
          <thead>
            <tr>
              <th>Item Details</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Tax</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(document.lines || []).map((line, index) => (
              <tr key={`${document.id}-${index}`}>
                <td>
                  <strong>{line.description || "-"}</strong>
                  <small>{line.reason || "Standard purchase line"}</small>
                </td>
                <td>{line.quantity}</td>
                <td>{formatCurrency(line.rate)}</td>
                <td>{formatCurrency(line.tax)}</td>
                <td>{formatCurrency(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="purchase-document-total">
          <p><span>Subtotal</span><strong>{formatCurrency(document.subtotal)}</strong></p>
          <p><span>Taxable Amount</span><strong>{formatCurrency(document.tax)}</strong></p>
          <p className="total"><span>Total</span><strong>{formatCurrency(document.grandTotal)}</strong></p>
        </div>
      </section>

      <aside className="purchase-detail-aside">
        <button type="button" className="purchase-light-btn" onClick={onBack}>Back</button>
        <button type="button" onClick={() => window.print()}>Print</button>
        <div className="purchase-panel">
          <p>Ledger Impact</p>
          <div className="purchase-impact-line red"><span>Accounts Payable</span><strong>{formatCurrency(document.grandTotal)}</strong></div>
          <div className="purchase-impact-line blue"><span>Purchase Ledger</span><strong>{formatCurrency(document.subtotal)}</strong></div>
        </div>
        <div className="purchase-panel">
          <p>Event Timeline</p>
          <ul className="purchase-timeline">
            <li><strong>Document Created</strong><span>{document.createdAt?.slice(0, 10)}</span></li>
            <li><strong>Inventory Status</strong><span>{document.inventoryStatus}</span></li>
            <li><strong>Payment Status</strong><span>{document.paymentStatus}</span></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default function Purchase({ activePage: appActivePage, onChangePage, user }) {
  const products = useSelector((state) => state.product.items);
  const [activeTypeId, setActiveTypeId] = useState("dashboard");
  const [activePage, setActivePage] = useState("main");
  const [selectedId, setSelectedId] = useState(null);
  const [documents, setDocuments] = useState([]);

  const routeTypeId = appActivePage && appActivePage.startsWith("purchase-")
    ? appActivePage.replace("purchase-", "")
    : "dashboard";

  useEffect(() => {
    if (user?.id) {
      try {
        setDocuments(JSON.parse(localStorage.getItem(`billing:purchase-documents:${user.id}`) || "[]"));
      } catch {
        setDocuments([]);
      }
    } else {
      setDocuments([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (routeTypeId !== activeTypeId) {
      setActiveTypeId(routeTypeId);
      setActivePage(routeTypeId === "dashboard" ? "main" : "list");
      setSelectedId(null);
    }
  }, [routeTypeId, activeTypeId]);

  const activeType = documentTypes.find((type) => type.id === activeTypeId) || documentTypes[0];
  const selectedDocument = documents.find((document) => document.id === selectedId) || null;

  const persistDocuments = (nextDocuments) => {
    setDocuments(nextDocuments);
    if (user?.id) {
      localStorage.setItem(`billing:purchase-documents:${user.id}`, JSON.stringify(nextDocuments));
    }
  };

  const navigate = (typeId, page = "main", docId = null) => {
    setActiveTypeId(typeId);
    setActivePage(page);
    setSelectedId(docId);
    if (onChangePage) {
      onChangePage(typeId === "dashboard" ? "purchase-dashboard" : `purchase-${typeId}`);
    }
  };

  const openPage = (page, docId = null) => {
    setActivePage(page);
    if (page === "detail") {
      setSelectedId(docId || documents.find((document) => document.typeId === activeType.id)?.id || null);
    } else {
      setSelectedId(null);
    }
  };

  const saveDocument = (payload) => {
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

  if (activeTypeId === "dashboard") {
    return <PurchaseDashboard documents={documents} onNavigate={navigate} />;
  }

  return (
    <section className="purchase-workspace">
      <div className="sales-page-tabs">
        {["main", "create", "list", "detail"].map((page) => (
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
        <PurchaseMain type={activeType} documents={documents} onOpenPage={openPage} />
      ) : null}

      {activePage === "create" ? (
        <PurchaseForm
          type={activeType}
          products={products}
          onSave={saveDocument}
          onCancel={() => setActivePage("main")}
        />
      ) : null}

      {activePage === "list" ? (
        <PurchaseList
          type={activeType}
          documents={documents}
          onView={(id) => openPage("detail", id)}
          onCreate={() => setActivePage("create")}
        />
      ) : null}

      {activePage === "detail" ? (
        <PurchaseDetail
          type={activeType}
          document={selectedDocument}
          onBack={() => setActivePage("list")}
        />
      ) : null}
    </section>
  );
}
