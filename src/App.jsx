import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Update from "./pages/Update";
import { useDispatch } from "react-redux";
import { fetchCustomers } from "./store/slices/customerSlice";
import { fetchProducts } from "./store/slices/productSlice";
import { fetchInvoices } from "./store/slices/invoiceSlice";

const AUTH_USERS_KEY = "billing:auth-users";
const AUTH_SESSION_KEY = "billing:auth-session";
const TRIAL_DAYS = 60;

const pageMap = {
  billing: Billing,
  sales: Sales,
  customers: Customers,
  dashboard: Dashboard,
  products: Products,
  reports: Reports,
  settings: Settings,
  update: Update,
};
const UPDATE_ALERT_KEY = "billing:update-alert";
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};

const getUsers = () => readJson(AUTH_USERS_KEY, []);
const saveUsers = (users) => localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const users = getUsers();
    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) {
      setMessage("Email and password are required.");
      return;
    }

    if (mode === "signup") {
      if (users.some((user) => user.email === email)) {
        setMessage("Account already exists. Please login.");
        return;
      }

      const user = {
        id: `user-${Date.now()}`,
        name: form.name.trim() || "Shopkeeper",
        businessName: form.businessName.trim() || "Artisanal Shop",
        email,
        password: form.password,
        trialStartedAt: new Date().toISOString(),
        trialEndsAt: addDays(new Date(), TRIAL_DAYS),
        paymentStatus: "trial",
        paidUntil: null,
      };
      saveUsers([user, ...users]);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ userId: user.id }));
      onAuthenticated(user);
      return;
    }

    const user = users.find((item) => item.email === email && item.password === form.password);
    if (!user) {
      setMessage("Invalid login details.");
      return;
    }

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ userId: user.id }));
    onAuthenticated(user);
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <strong>Fluent Ledger</strong>
          <span>The Precision Atelier</span>
        </div>
        <div>
          <p className="muted">{mode === "login" ? "Welcome back" : "Start your free trial"}</p>
          <h1>{mode === "login" ? "Login to Billing Sys" : "Create your account"}</h1>
          <p className="auth-copy">Use the full billing software free for 2 months. Payment is required after the trial ends.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <>
              <input value={form.name} onChange={(event) => updateForm({ name: event.target.value })} placeholder="Owner name" />
              <input value={form.businessName} onChange={(event) => updateForm({ businessName: event.target.value })} placeholder="Business name" />
            </>
          ) : null}
          <input type="email" value={form.email} onChange={(event) => updateForm({ email: event.target.value })} placeholder="Email address" />
          <input type="password" value={form.password} onChange={(event) => updateForm({ password: event.target.value })} placeholder="Password" />
          {message ? <p className="auth-message">{message}</p> : null}
          <button type="submit">{mode === "login" ? "Login" : "Create Account"}</button>
        </form>

        <button type="button" className="auth-switch" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "New user? Sign up" : "Already have account? Login"}
        </button>
      </section>
    </main>
  );
}

function PaymentGate({ user, onPaymentComplete, onLogout }) {
  const trialEndsAt = new Date(user.trialEndsAt);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
  const isExpired = daysLeft <= 0;

  return (
    <main className="auth-shell payment-shell">
      <section className="auth-panel payment-panel">
        <div className="auth-brand">
          <strong>Fluent Ledger</strong>
          <span>License & Payment</span>
        </div>
        <div>
          <p className="muted">{user.businessName}</p>
          <h1>{isExpired ? "Trial expired" : `${daysLeft} trial days left`}</h1>
          <p className="auth-copy">
            Your account gets a 2 month free trial. After the trial, complete payment to continue using Billing Sys.
          </p>
        </div>
        <div className="payment-summary">
          <p><span>Plan</span><strong>Billing Sys Pro</strong></p>
          <p><span>Trial ends</span><strong>{trialEndsAt.toLocaleDateString("en-IN")}</strong></p>
          <p><span>Amount</span><strong>₹4,999 / year</strong></p>
        </div>
        <button type="button" onClick={onPaymentComplete}>
          {isExpired ? "Complete Payment & Unlock" : "Pay Now & Activate"}
        </button>
        {!isExpired ? <p className="muted payment-note">Payment can be completed now, or you can continue using the trial.</p> : null}
        <button type="button" className="auth-switch" onClick={onLogout}>Logout</button>
      </section>
    </main>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("sales");
  const [currentUser, setCurrentUser] = useState(() => {
    const session = readJson(AUTH_SESSION_KEY, null);
    if (!session?.userId) return null;
    return getUsers().find((user) => user.id === session.userId) || null;
  });
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
  const licenseBlocked = currentUser
    ? currentUser.paymentStatus === "paid"
      ? currentUser.paidUntil && new Date(currentUser.paidUntil).getTime() <= Date.now()
      : new Date(currentUser.trialEndsAt).getTime() <= Date.now()
    : false;

  const handleLogout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser(null);
  };

  const handlePaymentComplete = () => {
    const nextUser = {
      ...currentUser,
      paymentStatus: "paid",
      paidUntil: addDays(new Date(), 365),
    };
    const users = getUsers().map((user) => (user.id === nextUser.id ? nextUser : user));
    saveUsers(users);
    setCurrentUser(nextUser);
  };

  if (!currentUser) {
    return <AuthScreen onAuthenticated={setCurrentUser} />;
  }

  if (licenseBlocked) {
    return <PaymentGate user={currentUser} onPaymentComplete={handlePaymentComplete} onLogout={handleLogout} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onChange={setActivePage}
        showUpdateDot={showUpdateDot}
      />
      <div className="workspace">
        <Navbar title={activePage.toUpperCase()} appVersion={appVersion} onLogout={handleLogout} user={currentUser} />
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
