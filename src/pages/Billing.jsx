import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice } from "../store/slices/invoiceSlice";
import { formatCurrency } from "../utils/formatCurrency";
import BillPreview from "../components/BillPreview";

const INCH_TO_METER = 0.0254;
const emptyItem = { description: "", quantity: 0, unit: "meter", pricePerMeter: 0 };

const toMeters = (qty, unit) => (unit === "inch" ? Number(qty || 0) * INCH_TO_METER : Number(qty || 0));
const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Billing() {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customer.items);
  const products = useSelector((state) => state.product.items);
  const invoices = useSelector((state) => state.invoice.items);
  const [customerId, setCustomerId] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [invoiceDate, setInvoiceDate] = useState(toInputDate());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [latestInvoice, setLatestInvoice] = useState(null);
  const invoiceNo = useMemo(() => {
    const maxInvoiceNo = invoices.reduce((max, inv) => {
      const value = Number(inv?.invoiceNo);
      return Number.isInteger(value) && value > max ? value : max;
    }, 0);
    return String(maxInvoiceNo + 1);
  }, [invoices]);

  const summary = useMemo(() => {
    const normalized = items.map((item) => {
      const meters = toMeters(item.quantity, item.unit);
      const lineTotal = meters * Number(item.pricePerMeter || 0);
      return { ...item, meters, lineTotal };
    });
    const subtotal = normalized.reduce((sum, item) => sum + item.lineTotal, 0);
    const gstAmount = (subtotal * Number(gstPercent || 0)) / 100;
    const total = subtotal + gstAmount;
    return { normalized, subtotal, gstAmount, total };
  }, [items, gstPercent]);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const selectProduct = (index, productId) => {
    const selected = products.find((p) => String(p.id) === productId);
    updateItem(index, {
      description: selected ? selected.name : "",
      pricePerMeter: selected ? selected.pricePerMeter : 0
    });
  };

  const handleSave = async () => {
    const payload = {
      customerId: customerId ? Number(customerId) : null,
      gstPercent: Number(gstPercent || 0),
      invoiceDate,
      notes,
      items: items.filter((item) => Number(item.quantity) > 0)
    };
    const action = await dispatch(addInvoice(payload));
    if (action?.payload) {
      setLatestInvoice(action.payload);
    }
    setItems([{ ...emptyItem }]);
    setNotes("");
    setCustomerId("");
    setInvoiceDate(toInputDate());
  };

  const previewCustomer = useMemo(() => {
    if (!latestInvoice?.customerId) return null;
    return customers.find((c) => c.id === latestInvoice.customerId) || null;
  }, [customers, latestInvoice]);

  return (
    <section className="stack">
      <div className="panel">
        <h3>Create Invoice ({invoiceNo})</h3>
        <div className="form-grid-2">
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="number" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} placeholder="GST %" />
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
      </div>

      {items.map((item, index) => {
        const meters = toMeters(item.quantity, item.unit);
        const lineTotal = meters * Number(item.pricePerMeter || 0);

        return (
          <div className="panel form-grid-4" key={index}>
            <select onChange={(e) => selectProduct(index, e.target.value)} defaultValue="">
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(index, { description: e.target.value })}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(index, { quantity: e.target.value })}
            />
            <select value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })}>
              <option value="meter">Meter</option>
              <option value="inch">Inch</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price / Meter"
              value={item.pricePerMeter}
              onChange={(e) => updateItem(index, { pricePerMeter: e.target.value })}
            />
            <div className="value-box">Meters: {meters.toFixed(4)}</div>
            <div className="value-box">Line: {formatCurrency(lineTotal || 0)}</div>
            <button type="button" className="danger" onClick={() => removeItem(index)}>Remove</button>
          </div>
        );
      })}

      <button type="button" onClick={addItem}>+ Add Line Item</button>

      <div className="panel">
        <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="summary">
          <p>Subtotal: <strong>{formatCurrency(summary.subtotal)}</strong></p>
          <p>GST: <strong>{formatCurrency(summary.gstAmount)}</strong></p>
          <p>Total: <strong>{formatCurrency(summary.total)}</strong></p>
        </div>
        <button type="button" onClick={handleSave}>Save Invoice</button>
      </div>

      <BillPreview invoice={latestInvoice} customer={previewCustomer} />
    </section>
  );
}
