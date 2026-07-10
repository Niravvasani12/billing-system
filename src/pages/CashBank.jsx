import { useEffect, useMemo, useState } from "react";
import { FaDownload, FaEye, FaPlus, FaPrint } from "react-icons/fa";
import { formatCurrency } from "../utils/formatCurrency";

const pageTitles = {
  "cash-bank-dashboard": "Cash/Bank Dashboard",
  "cash-bank-payment-entry": "Payment Entry",
  "cash-bank-payment-list": "Payment List",
  "cash-bank-payment-detail": "Payment Detail",
  "cash-bank-receipt-entry": "Receipt Entry",
  "cash-bank-receipt-list": "Receipt List",
  "cash-bank-receipt-detail": "Receipt Detail",
  "cash-bank-cash-report": "Cash Report",
  "cash-bank-bank-report": "Bank Report",
  "cash-bank-transaction-history": "Transaction History",
};

const seedTransactions = [
  { id: "PAY-2401", type: "payment", mode: "Bank", party: "Lumina Architectural Supplies Ltd.", amount: 14250, status: "Authorized", category: "Vendor Payment", ref: "NEFT-88290", date: "2026-07-08", note: "Material purchase settlement" },
  { id: "REC-2401", type: "receipt", mode: "Cash", party: "Timber & Stone Co.", amount: 12450, status: "Cleared", category: "Customer Receipt", ref: "CR-2240", date: "2026-07-08", note: "Invoice collection" },
  { id: "PAY-2402", type: "payment", mode: "Cash", party: "Office Essentials", amount: 3150, status: "Pending", category: "Expense", ref: "PETTY-118", date: "2026-07-07", note: "Stationery and admin expense" },
  { id: "REC-2402", type: "receipt", mode: "Bank", party: "Aster Design Studio", amount: 38100, status: "Reconciled", category: "Customer Receipt", ref: "UPI-5581", date: "2026-07-06", note: "Part payment received" },
];

const emptyForm = {
  party: "",
  amount: "",
  mode: "Cash",
  category: "",
  ref: "",
  note: "",
};

const today = () => new Date().toISOString().slice(0, 10);

function StatGrid({ transactions }) {
  const totals = transactions.reduce(
    (acc, item) => {
      const amount = Number(item.amount || 0);
      if (item.type === "receipt") acc.receipts += amount;
      if (item.type === "payment") acc.payments += amount;
      if (item.mode === "Cash") acc.cash += item.type === "receipt" ? amount : -amount;
      if (item.mode === "Bank") acc.bank += item.type === "receipt" ? amount : -amount;
      return acc;
    },
    { receipts: 0, payments: 0, cash: 0, bank: 0 },
  );

  return (
    <div className="reports-stats-grid">
      <div className="report-stat-card"><p>Total Receipts</p><h2>{formatCurrency(totals.receipts)}</h2></div>
      <div className="report-stat-card"><p>Total Payments</p><h2>{formatCurrency(totals.payments)}</h2></div>
      <div className="report-stat-card"><p>Cash Balance</p><h2>{formatCurrency(totals.cash)}</h2></div>
      <div className="report-stat-card"><p>Bank Balance</p><h2>{formatCurrency(totals.bank)}</h2></div>
    </div>
  );
}

function TransactionTable({ rows, onView, compact = false }) {
  return (
    <div className={compact ? "sales-table compact" : "sales-table"}>
      <div className="sales-table-head">
        <span>Date</span><span>Voucher</span><span>Party</span><span>Mode</span><span>Amount</span><span>Status</span><span>Action</span>
      </div>
      {rows.map((item) => (
        <div className="sales-table-row" key={item.id}>
          <span>{item.date}</span>
          <strong>{item.id}</strong>
          <span>{item.party}</span>
          <span>{item.mode}</span>
          <strong>{formatCurrency(item.amount)}</strong>
          <span>{item.status}</span>
          <button type="button" className="sales-icon-btn" onClick={() => onView(item.id)} title="View">
            <FaEye />
          </button>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ transactions, onNavigate, onView }) {
  const latest = transactions.slice(0, 5);
  return (
    <section className="reports-dashboard">
      <div className="sales-intel-head">
        <div>
          <h3>Cash & Bank Command Center</h3>
          <p>Live settlement position, voucher movements, and ledger control.</p>
        </div>
        <div className="sales-hero-actions">
          <button type="button" onClick={() => onNavigate("cash-bank-payment-entry")}><FaPlus /> Payment</button>
          <button type="button" onClick={() => onNavigate("cash-bank-receipt-entry")}><FaPlus /> Receipt</button>
        </div>
      </div>
      <StatGrid transactions={transactions} />
      <div className="report-main-panel">
        <div className="report-section-title">
          <div><h3>Recent Ledger Entries</h3><p>Newest payment and receipt vouchers.</p></div>
        </div>
        <TransactionTable rows={latest} onView={onView} />
      </div>
    </section>
  );
}

function EntryPage({ type, onSave, onNavigate }) {
  const [form, setForm] = useState(emptyForm);
  const isReceipt = type === "receipt";
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      type,
      amount: Number(form.amount || 0),
      status: isReceipt ? "Cleared" : "Authorized",
      date: today(),
      category: form.category || (isReceipt ? "Customer Receipt" : "Vendor Payment"),
    });
  };

  return (
    <section className="reports-dashboard">
      <div className="sales-intel-head">
        <div><h3>{isReceipt ? "Record New Receipt" : "Record New Payment"}</h3><p>{isReceipt ? "Log incoming cash, UPI, cheque, or bank receipts." : "Capture outgoing cash and bank payment vouchers."}</p></div>
      </div>
      <form className="report-main-panel" onSubmit={submit}>
        <div className="settings-grid">
          <label>Party / Ledger<input value={form.party} onChange={(e) => update({ party: e.target.value })} placeholder="Ledger name" required /></label>
          <label>Amount<input type="number" value={form.amount} onChange={(e) => update({ amount: e.target.value })} placeholder="0.00" required /></label>
          <label>Mode<select value={form.mode} onChange={(e) => update({ mode: e.target.value })}><option>Cash</option><option>Bank</option><option>UPI</option><option>Cheque</option></select></label>
          <label>Category<input value={form.category} onChange={(e) => update({ category: e.target.value })} placeholder={isReceipt ? "Customer Receipt" : "Vendor Payment"} /></label>
          <label>Reference No.<input value={form.ref} onChange={(e) => update({ ref: e.target.value })} placeholder="Voucher / UTR / Cheque" /></label>
          <label>Note<input value={form.note} onChange={(e) => update({ note: e.target.value })} placeholder="Short narration" /></label>
        </div>
        <div className="report-actions-row">
          <button type="button" onClick={() => onNavigate(isReceipt ? "cash-bank-receipt-list" : "cash-bank-payment-list")}>Cancel</button>
          <button type="submit"><FaPlus /> Save {isReceipt ? "Receipt" : "Payment"}</button>
        </div>
      </form>
    </section>
  );
}

function ListPage({ type, transactions, onView, onCreate }) {
  const isReceipt = type === "receipt";
  const rows = transactions.filter((item) => item.type === type);
  return (
    <section className="reports-dashboard">
      <div className="sales-intel-head">
        <div><h3>{isReceipt ? "Incoming Receipts" : "Outgoing Payments"}</h3><p>{rows.length} vouchers tracked for audit and reconciliation.</p></div>
        <button type="button" onClick={onCreate}><FaPlus /> New {isReceipt ? "Receipt" : "Payment"}</button>
      </div>
      <StatGrid transactions={rows} />
      <TransactionTable rows={rows} onView={onView} />
    </section>
  );
}

function DetailPage({ item, onBack }) {
  if (!item) {
    return <section className="reports-dashboard"><div className="report-main-panel">Select a transaction from the list.</div></section>;
  }

  return (
    <section className="reports-dashboard">
      <div className="sales-intel-head">
        <div><h3>{item.id}</h3><p>{item.type === "receipt" ? "Receipt voucher detail" : "Payment voucher detail"}</p></div>
        <div className="sales-hero-actions">
          <button type="button" onClick={onBack}>Back</button>
          <button type="button" onClick={() => window.print()}><FaPrint /> Print</button>
        </div>
      </div>
      <div className="sales-page-grid">
        <div className="report-main-panel">
          <div className="report-section-title"><div><h3>Transaction Summary</h3><p>{item.party}</p></div><strong>{formatCurrency(item.amount)}</strong></div>
          <table className="sales-document-table">
            <tbody>
              <tr><td>Date</td><td>{item.date}</td></tr>
              <tr><td>Mode</td><td>{item.mode}</td></tr>
              <tr><td>Status</td><td>{item.status}</td></tr>
              <tr><td>Reference</td><td>{item.ref || "-"}</td></tr>
              <tr><td>Category</td><td>{item.category}</td></tr>
              <tr><td>Narration</td><td>{item.note || "-"}</td></tr>
            </tbody>
          </table>
        </div>
        <aside className="report-main-panel">
          <div className="report-section-title"><div><h3>Ledger Impact</h3><p>Double-entry preview</p></div></div>
          <div className="purchase-impact-line blue"><span>{item.mode} Ledger</span><strong>{item.type === "receipt" ? "+" : "-"}{formatCurrency(item.amount)}</strong></div>
          <div className="purchase-impact-line red"><span>{item.party}</span><strong>{item.type === "receipt" ? "-" : "+"}{formatCurrency(item.amount)}</strong></div>
        </aside>
      </div>
    </section>
  );
}

function ReportPage({ kind, transactions, onView }) {
  const rows = kind === "history" ? transactions : transactions.filter((item) => item.mode.toLowerCase() === kind);
  return (
    <section className="reports-dashboard">
      <div className="sales-intel-head">
        <div><h3>{kind === "history" ? "Transaction History" : `${kind.charAt(0).toUpperCase() + kind.slice(1)} Ledger Report`}</h3><p>Audit-ready voucher trail with balances and mode-wise movement.</p></div>
        <button type="button" onClick={() => window.print()}><FaDownload /> Export</button>
      </div>
      <StatGrid transactions={rows} />
      <TransactionTable rows={rows} onView={onView} />
    </section>
  );
}

export default function CashBank({ activePage: appActivePage, onChangePage, user }) {
  const storageKey = `billing:cash-bank:${user?.id || "guest"}`;
  const [transactions, setTransactions] = useState(seedTransactions);
  const [selectedId, setSelectedId] = useState(seedTransactions[0].id);

  useEffect(() => {
    try {
      setTransactions(JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(seedTransactions)));
    } catch {
      setTransactions(seedTransactions);
    }
  }, [storageKey]);

  const page = pageTitles[appActivePage] ? appActivePage : "cash-bank-dashboard";
  const selected = transactions.find((item) => item.id === selectedId) || transactions[0];
  const navigate = (nextPage) => onChangePage?.(nextPage);
  const view = (id) => {
    setSelectedId(id);
    const item = transactions.find((row) => row.id === id);
    navigate(item?.type === "receipt" ? "cash-bank-receipt-detail" : "cash-bank-payment-detail");
  };
  const save = (payload) => {
    const prefix = payload.type === "receipt" ? "REC" : "PAY";
    const next = [{ ...payload, id: `${prefix}-${Date.now().toString().slice(-5)}` }, ...transactions];
    setTransactions(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSelectedId(next[0].id);
    navigate(payload.type === "receipt" ? "cash-bank-receipt-detail" : "cash-bank-payment-detail");
  };

  if (page === "cash-bank-payment-entry") return <EntryPage type="payment" onSave={save} onNavigate={navigate} />;
  if (page === "cash-bank-receipt-entry") return <EntryPage type="receipt" onSave={save} onNavigate={navigate} />;
  if (page === "cash-bank-payment-list") return <ListPage type="payment" transactions={transactions} onView={view} onCreate={() => navigate("cash-bank-payment-entry")} />;
  if (page === "cash-bank-receipt-list") return <ListPage type="receipt" transactions={transactions} onView={view} onCreate={() => navigate("cash-bank-receipt-entry")} />;
  if (page === "cash-bank-payment-detail") return <DetailPage item={selected?.type === "payment" ? selected : transactions.find((item) => item.type === "payment")} onBack={() => navigate("cash-bank-payment-list")} />;
  if (page === "cash-bank-receipt-detail") return <DetailPage item={selected?.type === "receipt" ? selected : transactions.find((item) => item.type === "receipt")} onBack={() => navigate("cash-bank-receipt-list")} />;
  if (page === "cash-bank-cash-report") return <ReportPage kind="cash" transactions={transactions} onView={view} />;
  if (page === "cash-bank-bank-report") return <ReportPage kind="bank" transactions={transactions} onView={view} />;
  if (page === "cash-bank-transaction-history") return <ReportPage kind="history" transactions={transactions} onView={view} />;
  return <Dashboard transactions={transactions} onNavigate={navigate} onView={view} />;
}
