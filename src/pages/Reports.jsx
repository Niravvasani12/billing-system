import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { generatePdf } from "../utils/pdfGenerator";
import { formatCurrency } from "../utils/formatCurrency";
import InvoicePdfDocument from "../components/InvoicePdfDocument";
import LeatherReportPdfDocument from "../components/LeatherReportPdfDocument";
import { FaFileInvoice, FaFileInvoiceDollar, FaRuler, FaEye, FaDownload } from "react-icons/fa";
import { formatDate } from "../utils/dateUtils";

const rangeOptions = [
  { value: "all", label: "All" },
  { value: "1d", label: "Last 1 day" },
  { value: "7d", label: "Last 7 days" },
  { value: "1m", label: "Last 1 month" },
];

const CUSTOMER_ALL_KEY = "__all__";
const WALK_IN_KEY = "__walk_in__";

const inRange = (createdAt, range) => {
  if (range === "all") return true;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  if (range === "1d") return now - created <= oneDay;
  if (range === "7d") return now - created <= oneDay * 7;
  if (range === "1m") {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - 1);
    return created >= threshold.getTime();
  }
  return true;
};

export default function Reports() {
  const invoices = useSelector((state) => state.invoice.items);
  const customers = useSelector((state) => state.customer.items);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");
  const [selectedCustomerKey, setSelectedCustomerKey] =
    useState(CUSTOMER_ALL_KEY);
  const [pdfInvoice, setPdfInvoice] = useState(null);
  const [downloadingLeatherPdf, setDownloadingLeatherPdf] = useState(false);

  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((customer) => map.set(customer.id, customer));
    return map;
  }, [customers]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (!inRange(invoice.createdAt, range)) return false;
      if (!term) return true;
      const customerName = (
        customerMap.get(invoice.customerId)?.name || ""
      ).toLowerCase();
      return (
        (invoice.invoiceNo || "").toLowerCase().includes(term) ||
        customerName.includes(term)
      );
    });
  }, [invoices, range, search, customerMap]);

  const customerInvoiceSummary = useMemo(() => {
    const grouped = new Map();

    filteredInvoices.forEach((invoice) => {
      const key = invoice.customerId ? String(invoice.customerId) : WALK_IN_KEY;
      const customer = customerMap.get(invoice.customerId);
      const customerName = customer?.name || "Walk-in Customer";
      const current = grouped.get(key) || {
        key,
        name: customerName,
        count: 0,
        total: 0,
      };

      current.count += 1;
      current.total += Number(invoice.total || 0);
      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [filteredInvoices, customerMap]);

  const visibleInvoices = useMemo(() => {
    if (selectedCustomerKey === CUSTOMER_ALL_KEY) return filteredInvoices;
    return filteredInvoices.filter((invoice) => {
      const key = invoice.customerId ? String(invoice.customerId) : WALK_IN_KEY;
      return key === selectedCustomerKey;
    });
  }, [filteredInvoices, selectedCustomerKey]);

  useEffect(() => {
    if (selectedCustomerKey === CUSTOMER_ALL_KEY) return;
    const hasSelectedCustomer = customerInvoiceSummary.some(
      (entry) => entry.key === selectedCustomerKey,
    );
    if (!hasSelectedCustomer) {
      setSelectedCustomerKey(CUSTOMER_ALL_KEY);
    }
  }, [selectedCustomerKey, customerInvoiceSummary]);

  const revenue = filteredInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0,
  );

  const leatherRows = useMemo(() => {
    return filteredInvoices.flatMap((invoice) => {
      const customerName =
        customerMap.get(invoice.customerId)?.name || "Walk-in Customer";
      const date = invoice.createdAt ? formatDate(invoice.createdAt) : "-";
      const items = invoice.items || [];

      return items.map((item) => ({
        invoiceId: invoice.id,
        itemId: item.id,
        date,
        invoiceNo: invoice.invoiceNo,
        customerName,
        itemName: item.description || "-",
        meters: Number(item.meters || 0),
        pricePerMeter: Number(item.pricePerMeter || 0),
        lineTotal: Number(item.lineTotal || 0),
        unit: item.unit || "",
      }));
    });
  }, [filteredInvoices, customerMap]);

  const leatherTotals = useMemo(() => {
    return leatherRows.reduce(
      (acc, row) => ({
        meters: acc.meters + Number(row.meters || 0),
        amount: acc.amount + Number(row.lineTotal || 0),
      }),
      { meters: 0, amount: 0 },
    );
  }, [leatherRows]);

  const reportDateRangeLabel = useMemo(() => {
    if (filteredInvoices.length === 0) return { from: "-", to: "-" };
    const timestamps = filteredInvoices
      .map((invoice) => new Date(invoice.createdAt).getTime())
      .filter((value) => Number.isFinite(value));
    if (timestamps.length === 0) return { from: "-", to: "-" };
    const from = new Date(Math.min(...timestamps)).toLocaleDateString("en-GB");
    const to = new Date(Math.max(...timestamps)).toLocaleDateString("en-GB");
    return { from, to };
  }, [filteredInvoices]);

  const handleInvoiceClick = async (invoice) => {
    const ok = window.confirm(`Download PDF for ${invoice.invoiceNo}?`);
    if (!ok) return;

    setPdfInvoice(invoice);
    await new Promise((resolve) => setTimeout(resolve, 120));
    await generatePdf(invoice.invoiceNo, {
      elementId: "report-bill-pdf",
      containerSelector: ".pdf-only-report",
      fileNamePrefix: "Invoice",
      singlePage: true,
    });
  };

  const downloadLeatherReportPdf = async () => {
    if (downloadingLeatherPdf) return;
    setDownloadingLeatherPdf(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 120));
      await generatePdf(new Date().toISOString().slice(0, 10), {
        elementId: "leather-report-pdf",
        containerSelector: ".pdf-only-leather-report",
        fileNamePrefix: "Leather_Report",
        singlePage: false,
      });
    } finally {
      setDownloadingLeatherPdf(false);
    }
  };

  return (
    <section className="reports-dashboard">
      {/* Premium Header */}
      <div className="sales-intel-head" style={{ marginBottom: "14px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Report Intelligence</h3>
          <p style={{ fontSize: "11px", color: "#64748b" }}>Comprehensive invoice history, customer selection ledger, and PDF reports.</p>
        </div>
        <div className="sales-hero-actions">
          <button
            type="button"
            className="sales-icon-btn"
            style={{
              width: "auto",
              padding: "8px 16px",
              background: "#0d9488",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700"
            }}
            onClick={downloadLeatherReportPdf}
            disabled={downloadingLeatherPdf}
          >
            <FaDownload />
            <span>
              {downloadingLeatherPdf
                ? "Preparing Leather Report..."
                : "Download Leather Report"}
            </span>
          </button>
        </div>
      </div>

      {/* Styled Top Cards */}
      <div className="sales-ledger-stats" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginBottom: "14px" }}>
        <div className="panel sales-stat-card">
          <div className="sales-stat-top">
            <span className="sales-stat-icon blue"><FaFileInvoice /></span>
            <strong style={{ color: "#10b981" }}>Active</strong>
          </div>
          <p>Invoice Count</p>
          <h2>{filteredInvoices.length}</h2>
        </div>
        <div className="panel sales-stat-card">
          <div className="sales-stat-top">
            <span className="sales-stat-icon violet"><FaFileInvoiceDollar /></span>
            <strong style={{ color: "#10b981" }}>Stable</strong>
          </div>
          <p>Revenue</p>
          <h2>{formatCurrency(revenue)}</h2>
        </div>
        <div className="panel sales-stat-card">
          <div className="sales-stat-top">
            <span className="sales-stat-icon warm"><FaRuler /></span>
            <strong style={{ color: "#10b981" }}>Active</strong>
          </div>
          <p>Total Meters</p>
          <h2>{leatherTotals.meters.toFixed(3)} MTR</h2>
        </div>
      </div>

      <div className="panel report-filter-row">
        <input
          placeholder="Search by Invoice No or Customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={range} onChange={(e) => setRange(e.target.value)}>
          {rangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="panel report-main-panel">
        <div className="report-section-title" style={{ borderBottom: "1px solid #f0efeb", paddingBottom: "10px", marginBottom: "10px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Customer Invoice Report</h3>
        </div>

        <div className="report-customer-layout">
          <div className="report-customer-list">
            <button
              type="button"
              className={`customer-filter-btn ${
                selectedCustomerKey === CUSTOMER_ALL_KEY ? "active" : ""
              }`}
              onClick={() => setSelectedCustomerKey(CUSTOMER_ALL_KEY)}
            >
              <span>All Customers</span>
              <strong>{filteredInvoices.length} invoices</strong>
            </button>

            {customerInvoiceSummary.map((entry) => (
              <button
                type="button"
                key={entry.key}
                className={`customer-filter-btn ${
                  selectedCustomerKey === entry.key ? "active" : ""
                }`}
                onClick={() => setSelectedCustomerKey(entry.key)}
              >
                <span>{entry.name}</span>
                <strong>
                  {entry.count} invoice{entry.count > 1 ? "s" : ""}
                </strong>
              </button>
            ))}

            {customerInvoiceSummary.length === 0 && (
              <p className="muted">No customers found for this filter.</p>
            )}
          </div>

          <div className="report-invoice-panel">
            <div className="sales-section-head" style={{ marginBottom: "14px", borderBottom: "1px solid #f0efeb", paddingBottom: "8px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Invoices</h3>
              <span className="sales-pill">{visibleInvoices.length} Found</span>
            </div>
            
            <div className="sales-table">
              <div className="sales-table-head" style={{ background: "#f8fafc", color: "#64748b", fontWeight: "700" }}>
                <span>Invoice No</span>
                <span>Customer</span>
                <span>Date</span>
                <span>Amount</span>
                <span style={{ textAlign: "right" }}>Action</span>
              </div>
              {visibleInvoices.map((invoice) => (
                <div className="sales-table-row" key={invoice.id}>
                  <strong>{invoice.invoiceNo}</strong>
                  <span>
                    {customerMap.get(invoice.customerId)?.name ||
                      "Walk-in Customer"}
                  </span>
                  <span>{formatDate(invoice.createdAt)}</span>
                  <strong style={{ color: "#0f3f7a" }}>{formatCurrency(invoice.total)}</strong>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="sales-icon-btn"
                      title="Download PDF"
                      onClick={() => handleInvoiceClick(invoice)}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "6px",
                        background: "#0f766e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      <FaEye />
                    </button>
                  </div>
                </div>
              ))}
              {visibleInvoices.length === 0 && (
                <p className="muted" style={{ padding: "16px", textAlign: "center" }}>
                  No invoices found for selected customer and filter.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <InvoicePdfDocument
        invoice={pdfInvoice}
        customer={customerMap.get(pdfInvoice?.customerId) || null}
        elementId="report-bill-pdf"
        containerClass="pdf-only-report"
      />

      <LeatherReportPdfDocument
        rows={leatherRows}
        totalAmount={leatherTotals.amount}
        totalMeters={leatherTotals.meters}
        fromDate={reportDateRangeLabel.from}
        toDate={reportDateRangeLabel.to}
        elementId="leather-report-pdf"
        containerClass="pdf-only-leather-report"
      />
    </section>
  );
}
