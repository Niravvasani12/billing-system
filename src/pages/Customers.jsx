import { useDispatch, useSelector } from "react-redux";
import CustomerForm from "../components/CustomerForm";
import { addCustomer, fetchCustomers } from "../store/slices/customerSlice";

export default function Customers() {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customer.items);

  const handleAdd = async (payload) => {
    await dispatch(addCustomer(payload));
    dispatch(fetchCustomers());
  };

  return (
    <section className="stack">
      <div className="panel"><h3>Add Customer</h3><CustomerForm onSubmit={handleAdd} /></div>
      <div className="panel">
        <h3>Customer List</h3>
        {customers.map((c) => (
          <div className="list-row" key={c.id}><strong>{c.name}</strong><span>{c.phone || "-"}</span><span>{c.email || "-"}</span></div>
        ))}
      </div>
    </section>
  );
}
