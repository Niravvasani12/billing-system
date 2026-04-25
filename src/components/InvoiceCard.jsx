import { formatCurrency } from "../utils/formatCurrency";

export default function InvoiceCard({ invoice }) {
  return (
    <article className="panel">
      <strong>{invoice.invoiceNo}</strong>
      <p className="muted">{new Date(invoice.createdAt).toLocaleString()}</p>
      <p>Items: {invoice.items?.length || 0}</p>
      <h3>{formatCurrency(invoice.total)}</h3>
    </article>
  );
}
