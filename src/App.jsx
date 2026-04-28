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
const UPDATE_ALERT_KEY = "billing:update-alert";
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [updateState, setUpdateState] = useState({
    status: "idle",
    message: "",
    version: null,
    progress: null,
  });
  const [appVersion, setAppVersion] = useState("");
  const [updateAlert, setUpdateAlert] = useState(null);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
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

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const isUpdatePending = ["available", "downloading", "downloaded"].includes(
      updateState.status
    );

    if (!isUpdatePending) {
      localStorage.removeItem(UPDATE_ALERT_KEY);
      setUpdateAlert(null);
      setIsAlertDismissed(false);
      return;
    }

    const activeVersion = updateState.version || "unknown";
    let persisted = null;

    try {
      persisted = JSON.parse(localStorage.getItem(UPDATE_ALERT_KEY) || "null");
    } catch {
      persisted = null;
    }

    if (!persisted || persisted.version !== activeVersion) {
      persisted = { version: activeVersion, firstSeenAt: Date.now() };
      localStorage.setItem(UPDATE_ALERT_KEY, JSON.stringify(persisted));
      setIsAlertDismissed(false);
    }

    setUpdateAlert(persisted);
  }, [updateState.status, updateState.version]);

  const forceUpdate = Boolean(
    updateAlert && nowMs - updateAlert.firstSeenAt >= TWO_DAYS_MS
  );
  const shouldShowAlert =
    ["available", "downloading", "downloaded"].includes(updateState.status) &&
    (forceUpdate || !isAlertDismissed);

  useEffect(() => {
    if (!shouldShowAlert) return;

    if (forceUpdate && activePage !== "update") {
      setActivePage("update");
    }

    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = forceUpdate ? 880 : 720;
      gain.gain.value = 0.07;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
      oscillator.onended = () => context.close();
    } catch {
      // no-op: some systems block autoplay audio until user interaction
    }
  }, [shouldShowAlert, forceUpdate, activePage]);

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
      {shouldShowAlert ? (
        <div className="update-alert-backdrop">
          <div className="update-alert-modal">
            <h3>{forceUpdate ? "Update Required" : "New Update Available"}</h3>
            <p>
              {updateState.message || "A new version is available for your billing system."}
            </p>
            {forceUpdate ? (
              <p className="update-alert-danger">
                More than 2 days passed. Please update now to continue using the app.
              </p>
            ) : null}
            <div className="update-alert-actions">
              {!forceUpdate ? (
                <button
                  type="button"
                  className="update-btn secondary"
                  onClick={() => setIsAlertDismissed(true)}
                >
                  Remind Me Later
                </button>
              ) : null}
              <button
                type="button"
                className="update-btn"
                onClick={updateState.status === "downloaded" ? handleInstallUpdate : handleCheckForUpdate}
              >
                {updateState.status === "downloaded" ? "Update Now" : "Check Update"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
