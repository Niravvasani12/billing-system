import { useSelector } from "react-redux";
import InvoiceCard from "../components/InvoiceCard";

export default function Dashboard() {
  const invoices = useSelector((state) => state.invoice.items);
  const customers = useSelector((state) => state.customer.items);
  const products = useSelector((state) => state.product.items);

  return (
    <section className="stack">
      <div className="cards-3">
        <div className="panel">
          <p className="muted">Invoices</p>
          <h2>{invoices.length}</h2>
        </div>
        <div className="panel">
          <p className="muted">Customers🙋🏻‍♂️</p>
          <h2>{customers.length}</h2>
        </div>
        <div className="panel">
          <p className="muted">Products🏷️</p>
          <h2>{products.length}</h2>
        </div>
      </div>
      <h3>Recent Invoices</h3>
      <div className="cards-3">
        {invoices.slice(0, 6).map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </section>
  );
}
