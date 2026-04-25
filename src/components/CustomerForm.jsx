import { useState } from "react";

const defaultState = { name: "", phone: "", email: "", address: "" };

export default function CustomerForm({ onSubmit }) {
  const [form, setForm] = useState(defaultState);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
    setForm(defaultState);
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <button type="submit">Save Customer</button>
    </form>
  );
}
