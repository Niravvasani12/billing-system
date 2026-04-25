import { useState } from "react";

const defaultState = { name: "", sku: "", pricePerMeter: "" };

export default function ProductForm({ onSubmit }) {
  const [form, setForm] = useState(defaultState);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, pricePerMeter: Number(form.pricePerMeter || 0) });
    setForm(defaultState);
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <input placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Price / Meter"
        value={form.pricePerMeter}
        onChange={(e) => setForm({ ...form, pricePerMeter: e.target.value })}
      />
      <button type="submit">Save Product</button>
    </form>
  );
}
