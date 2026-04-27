import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Update from "./pages/Update";
import { useDispatch } from "react-redux";
import { fetchCustomers } from "./store/slices/customerSlice";
import { fetchProducts } from "./store/slices/productSlice";
import { fetchInvoices } from "./store/slices/invoiceSlice";

const pageMap = {
  billing: Billing,
  customers: Customers,
  dashboard: Dashboard,
  products: Products,
  reports: Reports,
  settings: Settings,
  update: Update,
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [updateState, setUpdateState] = useState({
    status: "idle",
    message: "",
    version: null,
    progress: null,
  });
  const [appVersion, setAppVersion] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
    dispatch(fetchInvoices());
  }, [dispatch]);

  useEffect(() => {
    if (!window.billingAPI?.app) return;

    let unsubscribe = () => {};

    const initUpdates = async () => {
      const version = await window.billingAPI.app.getVersion();
      setAppVersion(version || "");
      unsubscribe = window.billingAPI.app.onUpdateStatus((payload) => {
        setUpdateState((prev) => ({ ...prev, ...payload }));
      });
      await window.billingAPI.app.checkForUpdates();
    };

    initUpdates();

    return () => unsubscribe();
  }, []);

  const handleCheckForUpdate = async () => {
    if (!window.billingAPI?.app) return;
    await window.billingAPI.app.checkForUpdates();
  };

  const handleInstallUpdate = async () => {
    if (!window.billingAPI?.app) return;
    await window.billingAPI.app.installUpdate();
  };

  const showUpdateDot = ["available", "downloading", "downloaded"].includes(
    updateState.status
  );

  const ActivePage = useMemo(() => pageMap[activePage] || Dashboard, [activePage]);

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onChange={setActivePage}
        showUpdateDot={showUpdateDot}
      />
      <div className="workspace">
        <Navbar title={activePage.toUpperCase()} appVersion={appVersion} />
        <main className="content">
          {activePage === "update" ? (
            <Update
              appVersion={appVersion}
              updateState={updateState}
              onCheckForUpdate={handleCheckForUpdate}
              onInstallUpdate={handleInstallUpdate}
            />
          ) : (
            <ActivePage />
          )}
        </main>
      </div>
    </div>
  );
}
