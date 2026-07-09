import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Sales from "./pages/Sales";
import Purchase from "./pages/Purchase";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Update from "./pages/Update";
import AdminPanel from "./pages/AdminPanel";
import { useDispatch } from "react-redux";
import logo from "./assets/VyaparOs.png";
import { fetchCustomers, clearCustomers } from "./store/slices/customerSlice";
import { fetchProducts, clearProducts } from "./store/slices/productSlice";
import { fetchInvoices, clearInvoices } from "./store/slices/invoiceSlice";
import { readAppSettings, writeAppSettings } from "./utils/appSettings";
import SplashScreen from "./components/SplashScreen";
import { cloudAuth } from "./services/cloudAuthService";

const AUTH_USERS_KEY = "billing:auth-users";
const AUTH_SESSION_KEY = "billing:auth-session";
const TRIAL_DAYS = 60;

const pageMap = {
  billing: Billing,
  sales: Sales,
  purchase: Purchase,
  inventory: Inventory,
  customers: Customers,
  dashboard: Dashboard,
  products: Products,
  reports: Reports,
  settings: Settings,
  update: Update,
  admin: AdminPanel,
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

const getUsers = () => cloudAuth.listUsers();
const saveUsers = (users) => cloudAuth.saveUsers(users);

const signupBusinessTypes = [
  "Jewellery",
  "Textile",
  "Grocery",
  "Hardware",
  "DTF Printing",
  "Electronics",
  "Pharmacy",
  "Furniture",
  "Automobile Parts",
  "Restaurant",
  "Bakery",
  "Cafe",
  "Mobile Shop",
  "Computer",
  "Paint Shop",
  "Steel",
  "Tiles & Marble",
  "Plywood",
  "Stationery",
  "Book Store",
  "Gift Shop",
  "Footwear",
  "Boutique",
  "Tailor",
  "Optical",
  "Sweet Mart",
  "Dairy",
  "Clinic",
  "Hospital",
  "Diagnostic",
  "IT Company",
  "Digital Marketing",
  "Consultancy",
  "Gym",
  "Beauty Salon"
];

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [otpState, setOtpState] = useState(null);
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
    businessType: "",
    otp: ""
  });
  const [message, setMessage] = useState("");

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();

    if (!email) {
      setMessage("Email address is required.");
      return;
    }

    if (mode === "signup") {
      if (!form.password) {
        setMessage("Password is required.");
        return;
      }
      if (!otpState || otpState.email !== email || otpState.purpose !== "signup") {
        try {
          const otp = await cloudAuth.requestOtp(email, "signup");
          setOtpState({ email, purpose: "signup", code: otp.code });
          setMessage(otp.code ? `OTP sent to ${email}. Desktop test OTP: ${otp.code}` : `OTP sent to ${email}.`);
        } catch (error) {
          setMessage(error.message);
        }
        return;
      }

      try {
        const user = await cloudAuth.signup({ ...form, otp: form.otp });
        onAuthenticated(user, form.businessName.trim(), form.businessType || "General");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (mode === "otp") {
      if (!otpState || otpState.email !== email || otpState.purpose !== "login") {
        try {
          const otp = await cloudAuth.requestOtp(email, "login");
          setOtpState({ email, purpose: "login" });
          setMessage(otp.code ? `OTP sent for login. Desktop test OTP: ${otp.code}` : "OTP sent to your email.");
        } catch (error) {
          setMessage(error.message);
        }
        return;
      }

      try {
        const user = await cloudAuth.loginWithOtp(email, form.otp);
        onAuthenticated(user);
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (!form.password) {
      setMessage("Password is required.");
      return;
    }

    try {
      const user = await cloudAuth.login(email, form.password);
      onAuthenticated(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <img src={logo} alt="VyapaarOS Logo" className="auth-logo" />
          <div>
            <strong>VyapaarOS</strong>
            <span>The Precision Atelier</span>
          </div>
        </div>
        <div>
          <p className="muted">{mode === "signup" ? "Start your free trial" : mode === "otp" ? "OTP login" : "Welcome back"}</p>
          <h1>{mode === "signup" ? "Create your account" : mode === "otp" ? "Login with OTP" : "Login to VyapaarOS"}</h1>
          <p className="auth-copy">Cloud authentication stores users, licenses, and device binding for shopkeeper desktop accounts.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <>
              <input required value={form.name} onChange={(event) => updateForm({ name: event.target.value })} placeholder="Owner name *" />
              <input required value={form.businessName} onChange={(event) => updateForm({ businessName: event.target.value })} placeholder="Business name *" />
            </>
          ) : null}
          <input type="email" value={form.email} onChange={(event) => updateForm({ email: event.target.value })} placeholder="Email address" />
          {mode !== "otp" ? (
            <input type="password" value={form.password} onChange={(event) => updateForm({ password: event.target.value })} placeholder="Password" />
          ) : null}
          {(mode === "otp" || (mode === "signup" && otpState?.purpose === "signup" && otpState.email === form.email.trim().toLowerCase())) ? (
            <input value={form.otp} onChange={(event) => updateForm({ otp: event.target.value })} placeholder="Enter 6 digit OTP" />
          ) : null}
          {message ? <p className="auth-message">{message}</p> : null}
          <button type="submit">
            {mode === "signup"
              ? otpState?.purpose === "signup" && otpState.email === form.email.trim().toLowerCase()
                ? "Verify OTP & Activate Account"
                : "Create Account"
              : mode === "otp"
                ? otpState?.purpose === "login" && otpState.email === form.email.trim().toLowerCase()
                  ? "Verify OTP & Login"
                  : "Send Login OTP"
                : "Login"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); setOtpState(null); }}>
          {mode === "signup" ? "Already have account? Login" : "New user? Sign up"}
        </button>
        <button type="button" className="auth-switch" onClick={() => { setMode(mode === "otp" ? "login" : "otp"); setMessage(""); setOtpState(null); }}>
          {mode === "otp" ? "Use password login" : "Login with OTP"}
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
          <img src={logo} alt="VyapaarOS Logo" className="auth-logo" />
          <div>
            <strong>VyapaarOS</strong>
            <span>License & Payment</span>
          </div>
        </div>
        <div>
          <p className="muted">{user.businessName}</p>
          <h1>{isExpired ? "Trial expired" : `${daysLeft} trial days left`}</h1>
          <p className="auth-copy">
            Your account gets a 2 month free trial. After the trial, complete payment to continue using VyapaarOS.
          </p>
        </div>
        <div className="payment-summary">
          <p><span>Plan</span><strong>VyapaarOS Pro</strong></p>
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
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [activePage, setActivePage] = useState("sales-dashboard");
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
    if (currentUser?.id) {
      dispatch(fetchCustomers(currentUser.id));
      dispatch(fetchProducts(currentUser.id));
      dispatch(fetchInvoices(currentUser.id));
    }
  }, [dispatch, currentUser?.id]);

  useEffect(() => {
    if (cloudAuth.isOwnerUser(currentUser)) {
      setActivePage("admin");
    }
  }, [currentUser]);

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

  const ActivePage = useMemo(() => {
    if (activePage.startsWith("sales")) {
      return Sales;
    }
    if (activePage.startsWith("purchase")) {
      return Purchase;
    }
    if (activePage.startsWith("inventory")) {
      return Inventory;
    }
    return pageMap[activePage] || Dashboard;
  }, [activePage]);
  const licenseBlocked = currentUser
    ? currentUser.paymentStatus === "paid"
      ? currentUser.paidUntil && new Date(currentUser.paidUntil).getTime() <= Date.now()
      : new Date(currentUser.trialEndsAt).getTime() <= Date.now()
    : false;
  const isOwnerUser = cloudAuth.isOwnerUser(currentUser);

  const handleLogout = () => {
    dispatch(clearCustomers());
    dispatch(clearProducts());
    dispatch(clearInvoices());
    localStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser(null);
  };

  const handlePaymentComplete = () => {
    const nextUser = cloudAuth.updateLicense(currentUser.id, {
      paymentStatus: "paid",
      paidUntil: addDays(new Date(), 365),
    });
    setCurrentUser(nextUser);
  };

  const handleAuthenticated = async (user, signupBusinessName, signupBusinessType) => {
    if (cloudAuth.isOwnerUser(user)) {
      setActivePage("admin");
      setCurrentUser(user);
      return;
    }

    if (signupBusinessType) {
      const current = await readAppSettings();
      await writeAppSettings({
        ...current,
        companyName: signupBusinessName || user.businessName,
        businessType: signupBusinessType
      });
      setActivePage("settings");
    } else {
      setActivePage("sales-dashboard");
    }
    setCurrentUser(user);
  };

  if (isSplashLoading) {
    return <SplashScreen onFinished={() => setIsSplashLoading(false)} />;
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  if (licenseBlocked && !isOwnerUser) {
    return <PaymentGate user={currentUser} onPaymentComplete={handlePaymentComplete} onLogout={handleLogout} />;
  }

  if (activePage === "admin") {
    return <AdminPanel user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onChange={setActivePage}
        showUpdateDot={showUpdateDot}
        user={currentUser}
      />
      <div className="workspace">
        <Navbar 
          title={activePage.toUpperCase()} 
          appVersion={appVersion} 
          onLogout={handleLogout} 
          user={currentUser} 
          showUpdateDot={showUpdateDot}
          onChangePage={setActivePage}
        />
        <main className="content">
          {activePage === "update" ? (
            <Update
              appVersion={appVersion}
              updateState={updateState}
              onCheckForUpdate={handleCheckForUpdate}
              onInstallUpdate={handleInstallUpdate}
            />
          ) : (
            <ActivePage activePage={activePage} onChangePage={setActivePage} user={currentUser} />
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
