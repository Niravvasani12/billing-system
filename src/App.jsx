import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { useDispatch } from "react-redux";
import { fetchCustomers } from "./store/slices/customerSlice";
import { fetchProducts } from "./store/slices/productSlice";
import { fetchInvoices } from "./store/slices/invoiceSlice";

const pageMap = {
  dashboard: Dashboard,
  billing: Billing,
  customers: Customers,
  products: Products,
  reports: Reports,
  settings: Settings
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
    dispatch(fetchInvoices());
  }, [dispatch]);

  const ActivePage = useMemo(() => pageMap[activePage] || Dashboard, [activePage]);

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onChange={setActivePage} />
      <div className="workspace">
        <Navbar title={activePage.toUpperCase()} />
        <main className="content">
          <ActivePage />
        </main>
      </div>
    </div>
  );
}
