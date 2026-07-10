import { useMemo, useState } from "react";
import { FaDownload, FaEye, FaFileInvoice, FaPrint } from "react-icons/fa";
import { formatCurrency } from "../utils/formatCurrency";

const pages = {
  "gst-dashboard": "GST Dashboard",
  "gst-gstr1-main": "GSTR-1 Main",
  "gst-gstr1-view": "GSTR-1 View",
  "gst-gstr1-customer-wise": "GSTR-1 Customer-wise",
  "gst-gstr1-download": "GSTR-1 Download",
  "gst-gstr2a-main": "GSTR-2A Main",
  "gst-gstr2a-summary": "GSTR-2A Summary",
  "gst-gstr2a-detail": "GSTR-2A Detail",
};

const outwardRows = [
  { id: "INV-2407-001", customer: "Timber & Stone Co.", gstin: "24AACCT8821B1Z9", taxable: 68500, cgst: 6165, sgst: 6165, igst: 0, status: "Ready", date: "2026-07-08" },
  { id: "INV-2407-002", customer: "Aster Design Studio", gstin: "27AAEFA4422K1Z7", taxable: 38100, cgst: 0, sgst: 0, igst: 6858, status: "Matched", date: "2026-07-07" },
  { id: "INV-2407-003", customer: "Urban Ledger Retail", gstin: "24AAACU1201P1Z2", taxable: 25200, cgst: 2268, sgst: 2268, igst: 0, status: "Review", date: "2026-07-06" },
];

const inwardRows = [
  { id: "2A-8891", vendor: "Lumina Architectural Supplies Ltd.", gstin: "27AABCL0987E1Z1", taxable: 142500, tax: 25650, status: "Matched", date: "2026-07-08" },
  { id: "2A-8892", vendor: "Metal Works India", gstin: "24AAFCM7710H1Z4", taxable: 31200, tax: 5616, status: "Missing in Books", date: "2026-07-06" },
  { id: "2A-8893", vendor: "Office Essentials", gstin: "24AAFCO1141C1Z6", taxable: 3150, tax: 567, status: "Reconcile", date: "2026-07-05" },
];

const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

function GstStats() {
  const outwardTax = sum(outwardRows, "cgst") + sum(outwardRows, "sgst") + sum(outwardRows, "igst");
  const inwardTax = sum(inwardRows, "tax");
  return (
    <div className="reports-stats-grid">
      <div className="report-stat-card"><p>Outward Taxable</p><h2>{formatCurrency(sum(outwardRows, "taxable"))}</h2></div>
      <div className="report-stat-card"><p>Output GST</p><h2>{formatCurrency(outwardTax)}</h2></div>
      <div className="report-stat-card"><p>Input GST</p><h2>{formatCurrency(inwardTax)}</h2></div>
      <div className="report-stat-card"><p>Net Liability</p><h2>{formatCurrency(outwardTax - inwardTax)}</h2></div>
    </div>
  );
}

function Header({ title, subtitle, children }) {
  return (
    <div className="sales-intel-head">
      <div><h3>{title}</h3><p>{subtitle}</p></div>
      <div className="sales-hero-actions">{children}</div>
    </div>
  );
}

function Gstr1Table({ onView }) {
  return (
    <div className="sales-table">
      <div className="sales-table-head">
        <span>Date</span><span>Invoice</span><span>Customer</span><span>GSTIN</span><span>Taxable</span><span>GST</span><span>Status</span><span>Action</span>
      </div>
      {outwardRows.map((row) => (
        <div className="sales-table-row" key={row.id}>
          <span>{row.date}</span><strong>{row.id}</strong><span>{row.customer}</span><span>{row.gstin}</span>
          <strong>{formatCurrency(row.taxable)}</strong><span>{formatCurrency(row.cgst + row.sgst + row.igst)}</span><span>{row.status}</span>
          <button type="button" className="sales-icon-btn" onClick={() => onView(row.id)}><FaEye /></button>
        </div>
      ))}
    </div>
  );
}

function Gstr2aTable({ onView }) {
  return (
    <div className="sales-table">
      <div className="sales-table-head">
        <span>Date</span><span>Ref</span><span>Vendor</span><span>GSTIN</span><span>Taxable</span><span>Input GST</span><span>Status</span><span>Action</span>
      </div>
      {inwardRows.map((row) => (
        <div className="sales-table-row" key={row.id}>
          <span>{row.date}</span><strong>{row.id}</strong><span>{row.vendor}</span><span>{row.gstin}</span>
          <strong>{formatCurrency(row.taxable)}</strong><span>{formatCurrency(row.tax)}</span><span>{row.status}</span>
          <button type="button" className="sales-icon-btn" onClick={() => onView(row.id)}><FaEye /></button>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ navigate }) {
  return (
    <section className="reports-dashboard">
      <Header title="GST Control Room" subtitle="Return readiness, liability, input credit, and reconciliation overview.">
        <button type="button" onClick={() => navigate("gst-gstr1-main")}><FaFileInvoice /> GSTR-1</button>
        <button type="button" onClick={() => navigate("gst-gstr2a-main")}><FaFileInvoice /> GSTR-2A</button>
      </Header>
      <GstStats />
      <div className="sales-page-grid">
        <div className="report-main-panel">
          <div className="report-section-title"><div><h3>Return Checklist</h3><p>Current month filing readiness.</p></div></div>
          {["Sales invoices mapped", "Debit/Credit notes reviewed", "Customer GSTIN validation", "2A input reconciliation"].map((item) => (
            <div className="purchase-impact-line blue" key={item}><span>{item}</span><strong>Done</strong></div>
          ))}
        </div>
        <div className="report-main-panel">
          <div className="report-section-title"><div><h3>Compliance Alerts</h3><p>Items needing review before filing.</p></div></div>
          <div className="purchase-impact-line red"><span>Review invoices</span><strong>1</strong></div>
          <div className="purchase-impact-line blue"><span>Matched 2A vendors</span><strong>1</strong></div>
          <div className="purchase-impact-line red"><span>Missing in books</span><strong>1</strong></div>
        </div>
      </div>
    </section>
  );
}

function Gstr1Main({ navigate, onView }) {
  return (
    <section className="reports-dashboard">
      <Header title="GSTR-1 Outward Supplies" subtitle="Sales register, invoice tax split, and filing status.">
        <button type="button" onClick={() => navigate("gst-gstr1-customer-wise")}>Customer-wise</button>
        <button type="button" onClick={() => navigate("gst-gstr1-download")}><FaDownload /> Download</button>
      </Header>
      <GstStats />
      <Gstr1Table onView={onView} />
    </section>
  );
}

function Gstr1View({ selectedId, navigate }) {
  const row = outwardRows.find((item) => item.id === selectedId) || outwardRows[0];
  return (
    <section className="reports-dashboard">
      <Header title={row.id} subtitle="GSTR-1 invoice tax detail and ledger mapping.">
        <button type="button" onClick={() => navigate("gst-gstr1-main")}>Back</button>
        <button type="button" onClick={() => window.print()}><FaPrint /> Print</button>
      </Header>
      <div className="report-main-panel">
        <table className="sales-document-table">
          <tbody>
            <tr><td>Customer</td><td>{row.customer}</td></tr>
            <tr><td>GSTIN</td><td>{row.gstin}</td></tr>
            <tr><td>Taxable</td><td>{formatCurrency(row.taxable)}</td></tr>
            <tr><td>CGST</td><td>{formatCurrency(row.cgst)}</td></tr>
            <tr><td>SGST</td><td>{formatCurrency(row.sgst)}</td></tr>
            <tr><td>IGST</td><td>{formatCurrency(row.igst)}</td></tr>
            <tr><td>Status</td><td>{row.status}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CustomerWise({ onView }) {
  const rows = useMemo(() => outwardRows.map((row) => ({ ...row, totalTax: row.cgst + row.sgst + row.igst })), []);
  return (
    <section className="reports-dashboard">
      <Header title="GSTR-1 Customer-wise" subtitle="Customer GSTIN summary for outward taxable supply." />
      <div className="sales-table">
        <div className="sales-table-head"><span>Customer</span><span>GSTIN</span><span>Invoices</span><span>Taxable</span><span>Tax</span><span>Action</span></div>
        {rows.map((row) => (
          <div className="sales-table-row" key={row.id}>
            <strong>{row.customer}</strong><span>{row.gstin}</span><span>1</span><span>{formatCurrency(row.taxable)}</span><span>{formatCurrency(row.totalTax)}</span>
            <button type="button" className="sales-icon-btn" onClick={() => onView(row.id)}><FaEye /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function DownloadPage() {
  return (
    <section className="reports-dashboard">
      <Header title="GSTR-1 Download Center" subtitle="Prepare filing exports for accountant and GST portal.">
        <button type="button" onClick={() => window.print()}><FaDownload /> Export Summary</button>
      </Header>
      <GstStats />
      <div className="sales-page-grid">
        {["JSON for GST portal", "Excel workbook", "B2B invoice sheet", "HSN summary"].map((item) => (
          <div className="report-main-panel" key={item}>
            <div className="report-section-title"><div><h3>{item}</h3><p>Generated from current sales register.</p></div></div>
            <button type="button"><FaDownload /> Download</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Gstr2aMain({ navigate, onView }) {
  return (
    <section className="reports-dashboard">
      <Header title="GSTR-2A Reconciliation" subtitle="Vendor input credit matching and exception control.">
        <button type="button" onClick={() => navigate("gst-gstr2a-summary")}>Summary</button>
      </Header>
      <GstStats />
      <Gstr2aTable onView={onView} />
    </section>
  );
}

function Gstr2aSummary({ onView }) {
  const matched = inwardRows.filter((row) => row.status === "Matched");
  const pending = inwardRows.filter((row) => row.status !== "Matched");
  return (
    <section className="reports-dashboard">
      <Header title="GSTR-2A Summary" subtitle="Input credit posture with matched and exception buckets." />
      <div className="reports-stats-grid">
        <div className="report-stat-card"><p>Matched ITC</p><h2>{formatCurrency(sum(matched, "tax"))}</h2></div>
        <div className="report-stat-card"><p>Pending ITC</p><h2>{formatCurrency(sum(pending, "tax"))}</h2></div>
        <div className="report-stat-card"><p>Vendors</p><h2>{inwardRows.length}</h2></div>
        <div className="report-stat-card"><p>Exceptions</p><h2>{pending.length}</h2></div>
      </div>
      <Gstr2aTable onView={onView} />
    </section>
  );
}

function Gstr2aDetail({ selectedId, navigate }) {
  const row = inwardRows.find((item) => item.id === selectedId) || inwardRows[0];
  return (
    <section className="reports-dashboard">
      <Header title={row.id} subtitle="Vendor invoice 2A matching detail.">
        <button type="button" onClick={() => navigate("gst-gstr2a-main")}>Back</button>
      </Header>
      <div className="report-main-panel">
        <table className="sales-document-table">
          <tbody>
            <tr><td>Vendor</td><td>{row.vendor}</td></tr>
            <tr><td>GSTIN</td><td>{row.gstin}</td></tr>
            <tr><td>Taxable</td><td>{formatCurrency(row.taxable)}</td></tr>
            <tr><td>Input GST</td><td>{formatCurrency(row.tax)}</td></tr>
            <tr><td>Status</td><td>{row.status}</td></tr>
            <tr><td>Action</td><td>{row.status === "Matched" ? "Claim eligible ITC" : "Reconcile with purchase register"}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function GST({ activePage: appActivePage, onChangePage }) {
  const [selectedId, setSelectedId] = useState(outwardRows[0].id);
  const page = pages[appActivePage] ? appActivePage : "gst-dashboard";
  const navigate = (nextPage) => onChangePage?.(nextPage);
  const viewGstr1 = (id) => {
    setSelectedId(id);
    navigate("gst-gstr1-view");
  };
  const viewGstr2a = (id) => {
    setSelectedId(id);
    navigate("gst-gstr2a-detail");
  };

  if (page === "gst-gstr1-main") return <Gstr1Main navigate={navigate} onView={viewGstr1} />;
  if (page === "gst-gstr1-view") return <Gstr1View selectedId={selectedId} navigate={navigate} />;
  if (page === "gst-gstr1-customer-wise") return <CustomerWise onView={viewGstr1} />;
  if (page === "gst-gstr1-download") return <DownloadPage />;
  if (page === "gst-gstr2a-main") return <Gstr2aMain navigate={navigate} onView={viewGstr2a} />;
  if (page === "gst-gstr2a-summary") return <Gstr2aSummary onView={viewGstr2a} />;
  if (page === "gst-gstr2a-detail") return <Gstr2aDetail selectedId={selectedId} navigate={navigate} />;
  return <Dashboard navigate={navigate} />;
}
