import { useEffect, useMemo, useState } from "react";
import {
  FaBan,
  FaBriefcase,
  FaChartLine,
  FaCheckCircle,
  FaCog,
  FaDesktop,
  FaEdit,
  FaFileContract,
  FaHistory,
  FaKey,
  FaLock,
  FaMoon,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUndo,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { cloudAuth } from "../services/cloudAuthService";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "-");
const daysRemaining = (value) => {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
};

const adminNav = [
  { id: "dashboard", label: "Dashboard", icon: <FaChartLine /> },
  { id: "users", label: "Users", icon: <FaUsers /> },
  { id: "businesses", label: "Businesses", icon: <FaBriefcase /> },
  { id: "subscriptions", label: "Subscriptions", icon: <FaFileContract /> },
  { id: "licenses", label: "Licenses", icon: <FaKey /> },
  { id: "activity", label: "Activity Logs", icon: <FaHistory /> },
  { id: "settings", label: "Settings", icon: <FaCog /> },
];

const emptyUserForm = {
  name: "",
  businessName: "",
  email: "",
  phone: "",
  password: "",
  businessType: "General",
  country: "India",
  state: "",
  city: "",
  gstNumber: "",
  businessAddress: "",
  plan: "Free Trial",
  subscriptionDuration: 60,
  accountStatus: "active",
  notes: "",
};

function AdminModal({ title, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-head">
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function UserForm({ initial, onSubmit }) {
  const [form, setForm] = useState({ ...emptyUserForm, ...initial });
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="form-grid-2">
        <input value={form.name} onChange={(event) => update({ name: event.target.value })} placeholder="Full Name" required />
        <input value={form.businessName} onChange={(event) => update({ businessName: event.target.value })} placeholder="Business Name" required />
        <input type="email" value={form.email} onChange={(event) => update({ email: event.target.value })} placeholder="Email" required />
        <input value={form.phone || ""} onChange={(event) => update({ phone: event.target.value })} placeholder="Mobile Number" />
        <input value={form.password || ""} onChange={(event) => update({ password: event.target.value })} placeholder="Password" />
        <input value={form.businessType || ""} onChange={(event) => update({ businessType: event.target.value })} placeholder="Business Type" />
        <input value={form.country || ""} onChange={(event) => update({ country: event.target.value })} placeholder="Country" />
        <input value={form.state || ""} onChange={(event) => update({ state: event.target.value })} placeholder="State" />
        <input value={form.city || ""} onChange={(event) => update({ city: event.target.value })} placeholder="City" />
        <input value={form.gstNumber || ""} onChange={(event) => update({ gstNumber: event.target.value })} placeholder="GST Number" />
        <select value={form.plan || "Free Trial"} onChange={(event) => update({ plan: event.target.value })}>
          <option>Free Trial</option>
          <option>Premium</option>
          <option>Enterprise</option>
        </select>
        <input type="number" value={form.subscriptionDuration || 60} onChange={(event) => update({ subscriptionDuration: event.target.value })} placeholder="Subscription Duration Days" />
        <select value={form.accountStatus || "active"} onChange={(event) => update({ accountStatus: event.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
      <textarea value={form.businessAddress || ""} onChange={(event) => update({ businessAddress: event.target.value })} placeholder="Business Address" />
      <textarea value={form.notes || ""} onChange={(event) => update({ notes: event.target.value })} placeholder="Admin Notes" />
      <button type="submit">Save User</button>
    </form>
  );
}

export default function AdminPanel({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState("light");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = async () => {
    try {
      await cloudAuth.refreshAdminData();
    } catch (error) {
      notify(error.message || "Could not refresh cloud admin data.");
    }
    setRefreshKey((key) => key + 1);
  };
  const adminName = user?.name || "Super Admin";
  const users = useMemo(() => cloudAuth.listUsers(), [refreshKey]);
  const licenses = useMemo(() => cloudAuth.listLicenses(), [refreshKey]);
  const devices = useMemo(() => cloudAuth.listDevices(), [refreshKey]);
  const logs = useMemo(() => cloudAuth.listActivity(), [refreshKey]);
  const settings = useMemo(() => cloudAuth.getAdminSettings(), [refreshKey]);
  const isOwner = cloudAuth.isOwnerUser(user);

  useEffect(() => {
    if (cloudAuth.isOwnerUser(user)) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const runAction = (message, action) => {
    Promise.resolve(action())
      .then(() => refresh())
      .then(() => notify(message))
      .catch((error) => notify(error.message || "Action failed."));
  };

  if (!isOwner) {
    return (
      <section className="admin-denied">
        <FaLock />
        <h1>Admin Panel Locked</h1>
        <p>Normal users must never access the Super Admin control panel.</p>
      </section>
    );
  }

  const filteredUsers = users.filter((item) => {
    const haystack = `${item.name} ${item.email} ${item.businessName} ${item.phone} ${item.city} ${item.gstNumber}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.accountStatus === statusFilter || item.paymentStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: users.length,
    active: users.filter((item) => item.accountStatus !== "blocked" && item.accountStatus !== "inactive").length,
    blocked: users.filter((item) => item.accountStatus === "blocked").length,
    trial: users.filter((item) => item.paymentStatus === "trial").length,
    premium: users.filter((item) => item.paymentStatus === "paid").length,
    expired: users.filter((item) => daysRemaining(item.paidUntil || item.trialEndsAt) === 0).length,
    businesses: new Set(users.map((item) => item.businessName)).size,
    todaySignups: users.filter((item) => item.createdAt?.slice(0, 10) === today).length,
  };

  const renderDashboard = () => (
    <div className="admin-tab-grid">
      <div className="admin-stat-grid">
        {[
          ["Total Registered Users", stats.total],
          ["Active Users", stats.active],
          ["Blocked Users", stats.blocked],
          ["Trial Users", stats.trial],
          ["Premium Users", stats.premium],
          ["Expired Subscriptions", stats.expired],
          ["Active Businesses", stats.businesses],
          ["Today's Signups", stats.todaySignups],
          ["Monthly Revenue", "INR 0"],
        ].map(([label, value]) => (
          <article className="admin-stat-card" key={label}>
            <p>{label}</p>
            <h2>{value}</h2>
          </article>
        ))}
      </div>
      <div className="admin-chart-grid">
        <section className="admin-panel">
          <h3>User Registration Growth</h3>
          <div className="admin-bars">{[28, 44, 36, 72, 54, 86].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
        </section>
        <section className="admin-panel">
          <h3>Subscription Distribution</h3>
          <div className="admin-donut"><span>{stats.premium}/{stats.total}</span></div>
        </section>
        <section className="admin-panel">
          <h3>Monthly Active Users</h3>
          <div className="admin-bars soft">{[40, 52, 48, 62, 74, 68].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
        </section>
      </div>
      <section className="admin-panel">
        <div className="admin-section-head"><div><p>Recent Activity</p><h3>Platform Events</h3></div></div>
        <ActivityRows logs={logs.slice(0, 6)} />
      </section>
    </div>
  );

  const renderUsers = () => (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <label><FaSearch /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search users..." /></label>
        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="inactive">Inactive</option>
          <option value="trial">Trial</option>
          <option value="paid">Premium</option>
        </select>
        <button type="button" onClick={() => setModal({ type: "create-user" })}><FaPlus /> Create User</button>
      </div>
      <div className="admin-user-table">
        <div className="admin-user-head">
          <span>User</span><span>Business</span><span>Location</span><span>GST</span><span>Status</span><span>Plan</span><span>Expiry</span><span>Actions</span>
        </div>
        {pagedUsers.map((item) => (
          <div className="admin-user-row" key={item.id}>
            <div className="admin-user-cell">
              <span className="admin-avatar">{(item.name || "U").slice(0, 2).toUpperCase()}</span>
              <div><strong>{item.name}</strong><small>{item.email} / {item.phone || "No mobile"}</small><small>Registered: {formatDate(item.createdAt)} / Last Login: {formatDateTime(item.lastLogin)}</small></div>
            </div>
            <span>{item.businessName}<small>{item.businessType}</small></span>
            <span>{item.city || "-"}<small>{item.state || "-"}, {item.country || "India"}</small></span>
            <span>{item.gstNumber || "-"}</span>
            <span className={`admin-pill ${item.accountStatus === "blocked" ? "danger" : "paid"}`}>{item.accountStatus || "active"}</span>
            <span className={`admin-pill ${item.paymentStatus === "paid" ? "paid" : "trial"}`}>{item.plan || item.paymentStatus}</span>
            <span>{formatDate(item.paidUntil || item.trialEndsAt)}<small>{daysRemaining(item.paidUntil || item.trialEndsAt)} days left</small></span>
            <span className="admin-action-stack">
              <button type="button" onClick={() => setModal({ type: "view-user", user: item })}><FaUserShield /> View</button>
              <button type="button" onClick={() => setModal({ type: "edit-user", user: item })}><FaEdit /> Edit</button>
              {item.accountStatus === "blocked" ? (
                <button type="button" onClick={() => runAction("User unblocked", () => cloudAuth.unblockUser(item.id, adminName))}><FaUndo /> Unblock</button>
              ) : (
                <button type="button" onClick={() => runAction("User blocked", () => cloudAuth.blockUser(item.id, adminName))}><FaBan /> Block</button>
              )}
              <button type="button" onClick={() => runAction("Password reset to 123456", () => cloudAuth.resetPassword(item.id, "123456", adminName))}>Reset</button>
              <button type="button" onClick={() => runAction("Email verified", () => cloudAuth.updateUser(item.id, { emailVerified: true }, adminName))}>Verify</button>
              {item.accountStatus === "inactive" ? (
                <button type="button" onClick={() => runAction("User activated", () => cloudAuth.updateUser(item.id, { accountStatus: "active" }, adminName))}>Activate</button>
              ) : (
                <button type="button" onClick={() => runAction("User deactivated", () => cloudAuth.updateUser(item.id, { accountStatus: "inactive" }, adminName))}>Deactivate</button>
              )}
              <button type="button" onClick={() => runAction("User force logout recorded", () => cloudAuth.forceLogoutUser(item.id, adminName))}>Logout</button>
              <button type="button" className="danger" onClick={() => setModal({ type: "delete-user", user: item })}><FaTrash /> Delete</button>
            </span>
          </div>
        ))}
      </div>
      <div className="admin-pagination">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </section>
  );

  const renderBusinesses = () => (
    <section className="admin-panel">
      <div className="admin-section-head"><div><p>Business Management</p><h3>Registered Businesses</h3></div></div>
      <div className="admin-simple-table businesses">
        <div><strong>Business Name</strong><strong>Owner</strong><strong>GST</strong><strong>City</strong><strong>State</strong><strong>Active Users</strong><strong>Plan</strong><strong>Status</strong></div>
        {users.map((item) => (
          <div key={item.id}>
            <span>{item.businessName}</span><span>{item.name}</span><span>{item.gstNumber || "-"}</span><span>{item.city || "-"}</span><span>{item.state || "-"}</span><span>1</span><span>{item.plan || item.paymentStatus}</span><span className="admin-business-actions"><b className="admin-pill paid">{item.accountStatus || "active"}</b><button type="button" onClick={() => setModal({ type: "edit-user", user: item })}>Edit</button></span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSubscriptions = () => (
    <section className="admin-panel">
      <div className="admin-section-head"><div><p>Subscription Management</p><h3>Plans and Duration</h3></div></div>
      <div className="admin-simple-table subscriptions">
        <div><strong>User</strong><strong>Plan</strong><strong>Status</strong><strong>Start Date</strong><strong>Expiry</strong><strong>Remaining</strong><strong>Auto Renewal</strong><strong>Actions</strong></div>
        {users.map((item) => (
          <div key={item.id}>
            <span>{item.name}<small>{item.email}</small></span>
            <span>{item.plan || (item.paymentStatus === "paid" ? "Premium" : "Free Trial")}</span>
            <span className={`admin-pill ${item.paymentStatus === "paid" ? "paid" : "trial"}`}>{item.paymentStatus}</span>
            <span>{formatDate(item.trialStartedAt || item.createdAt)}</span>
            <span>{formatDate(item.paidUntil || item.trialEndsAt)}</span>
            <span>{daysRemaining(item.paidUntil || item.trialEndsAt)} days</span>
            <span>No</span>
            <span className="admin-quick-actions">
              {[7, 15, 30, 90, 180, 365].map((days) => <button type="button" key={days} onClick={() => runAction(`Subscription extended +${days} days`, () => cloudAuth.extendSubscription(item.id, days, adminName))}>+{days}</button>)}
              <button type="button" onClick={() => runAction("Plan assigned", () => cloudAuth.updateUser(item.id, { plan: "Premium", paymentStatus: "paid" }, adminName))}>Assign</button>
              <button type="button" onClick={() => runAction("Plan upgraded", () => cloudAuth.updateUser(item.id, { plan: "Premium", paymentStatus: "paid" }, adminName))}>Upgrade</button>
              <button type="button" onClick={() => runAction("Plan downgraded", () => cloudAuth.updateUser(item.id, { plan: "Free Trial", paymentStatus: "trial" }, adminName))}>Downgrade</button>
              <button type="button" onClick={() => runAction("Subscription reduced by 7 days", () => cloudAuth.reduceSubscription(item.id, 7, adminName))}>-7</button>
              <button type="button" onClick={() => {
                const days = window.prompt("Enter custom days to extend, or negative days to reduce", "30");
                if (days) runAction(`Subscription changed by ${days} days`, () => cloudAuth.extendSubscription(item.id, Number(days), adminName));
              }}>Custom</button>
              <button type="button" onClick={() => runAction("Subscription paused", () => cloudAuth.updateUser(item.id, { paymentStatus: "paused" }, adminName))}>Pause</button>
              <button type="button" onClick={() => runAction("Subscription resumed", () => cloudAuth.updateUser(item.id, { paymentStatus: "paid" }, adminName))}>Resume</button>
              <button type="button" onClick={() => runAction("Subscription renewed", () => cloudAuth.extendSubscription(item.id, 365, adminName))}>Renew</button>
              <button type="button" onClick={() => runAction("Subscription cancelled", () => cloudAuth.updateUser(item.id, { paymentStatus: "expired", plan: "Cancelled" }, adminName))}>Cancel</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderLicenses = () => (
    <section className="admin-panel">
      <div className="admin-section-head"><div><p>License Management</p><h3>Software Licenses</h3></div></div>
      <div className="admin-simple-table licenses">
        <div><strong>License Key</strong><strong>User</strong><strong>Device Limit</strong><strong>Registered Devices</strong><strong>Activation</strong><strong>Last Active</strong><strong>Status</strong><strong>Actions</strong></div>
        {users.map((item) => {
          const license = licenses.find((entry) => entry.userId === item.id) || {};
          const userDevices = devices.filter((device) => device.userId === item.id);
          return (
            <div key={item.id}>
              <span>{license.licenseKey || license.id || `LIC-${item.id}`}</span>
              <span>{item.name}<small>{item.email}</small></span>
              <span>{license.maxDevices || 1}</span>
              <span>{userDevices.length}</span>
              <span>{formatDate(license.updatedAt || item.createdAt)}</span>
              <span>{formatDateTime(userDevices[0]?.lastSeenAt)}</span>
              <span className={`admin-pill ${license.status === "blocked" ? "danger" : "paid"}`}>{license.status || item.paymentStatus}</span>
              <span className="admin-quick-actions">
                <button type="button" onClick={() => runAction("License generated", () => cloudAuth.updateLicenseRecord(item.id, { licenseKey: `VOS-${Date.now()}`, status: "paid" }, adminName))}>Generate</button>
                <button type="button" onClick={() => runAction("License regenerated", () => cloudAuth.updateLicenseRecord(item.id, { licenseKey: `VOS-RG-${Date.now()}`, status: "paid" }, adminName))}>Regenerate</button>
                <button type="button" onClick={() => runAction("License disabled", () => cloudAuth.updateLicenseRecord(item.id, { status: "blocked" }, adminName))}>Disable</button>
                <button type="button" onClick={() => runAction("License enabled", () => cloudAuth.updateLicenseRecord(item.id, { status: "paid" }, adminName))}>Enable</button>
                <button type="button" onClick={() => runAction("Device limit increased", () => cloudAuth.updateLicenseRecord(item.id, { maxDevices: Number(license.maxDevices || 1) + 1 }, adminName))}>+Device</button>
                <button type="button" onClick={() => runAction("Device limit decreased", () => cloudAuth.updateLicenseRecord(item.id, { maxDevices: Math.max(1, Number(license.maxDevices || 1) - 1) }, adminName))}>-Device</button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="admin-device-list">
        <h3>Registered Devices</h3>
        {devices.map((device) => (
          <div key={device.id}>
            <span>{device.id}</span><span>{device.platform}</span><span>{formatDateTime(device.lastSeenAt)}</span>
            <button type="button" onClick={() => {
              if (window.confirm("Remove this registered device?")) {
                runAction("Device removed", () => cloudAuth.removeDevice(device.id, adminName));
              }
            }}>Remove Device</button>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSettings = () => (
    <SettingsForm
      settings={settings}
      onSave={(nextSettings) => runAction("Settings saved", () => cloudAuth.saveAdminSettings(nextSettings, adminName))}
      theme={theme}
      onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
    />
  );

  return (
    <section className={`super-admin-shell ${theme === "dark" ? "dark" : ""}`}>
      <aside className="super-admin-sidebar">
        <div className="super-admin-brand"><FaUserShield /><div><strong>Vyaapar OS</strong><span>Super Admin Only</span></div></div>
        <nav>
          {adminNav.map((item) => (
            <button type="button" key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="super-admin-main">
        <header className="super-admin-topbar">
          <div><p>Enterprise Platform Control</p><h1>{adminNav.find((item) => item.id === activeTab)?.label}</h1></div>
          <div className="super-admin-top-actions">
            <button type="button" onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}><FaMoon /> {theme === "dark" ? "Light" : "Dark"} Mode</button>
            {onLogout ? <button type="button" onClick={onLogout}>Logout</button> : null}
          </div>
        </header>
        {activeTab === "dashboard" ? renderDashboard() : null}
        {activeTab === "users" ? renderUsers() : null}
        {activeTab === "businesses" ? renderBusinesses() : null}
        {activeTab === "subscriptions" ? renderSubscriptions() : null}
        {activeTab === "licenses" ? renderLicenses() : null}
        {activeTab === "activity" ? <section className="admin-panel"><ActivityRows logs={logs} /></section> : null}
        {activeTab === "settings" ? renderSettings() : null}
      </main>
      {toast ? <div className="admin-toast">{toast}</div> : null}
      {modal?.type === "create-user" ? (
        <AdminModal title="Create User" onClose={() => setModal(null)}>
          <UserForm onSubmit={(payload) => runAction("User created", () => { cloudAuth.createUser(payload, adminName); setModal(null); })} />
        </AdminModal>
      ) : null}
      {modal?.type === "edit-user" ? (
        <AdminModal title="Edit User" onClose={() => setModal(null)}>
          <UserForm initial={modal.user} onSubmit={(payload) => runAction("User updated", () => { cloudAuth.updateUser(modal.user.id, payload, adminName); setModal(null); })} />
        </AdminModal>
      ) : null}
      {modal?.type === "view-user" ? (
        <AdminModal title="User Profile" onClose={() => setModal(null)}>
          <div className="admin-profile-view">
            {["name", "businessName", "email", "phone", "businessType", "country", "state", "city", "gstNumber", "accountStatus", "paymentStatus", "plan", "trialEndsAt", "paidUntil", "notes"].map((key) => (
              <p key={key}><span>{key}</span><strong>{String(modal.user[key] || "-")}</strong></p>
            ))}
          </div>
        </AdminModal>
      ) : null}
      {modal?.type === "delete-user" ? (
        <AdminModal title="Delete User" onClose={() => setModal(null)}>
          <p className="admin-confirm-text">Deleting this user removes account, business profile, subscription, license, devices, and cloud data.</p>
          <button type="button" className="danger" onClick={() => {
            if (window.confirm("Delete this user and all related cloud data?")) {
              runAction("User deleted", () => { cloudAuth.deleteUser(modal.user.id, adminName); setModal(null); });
            }
          }}>Confirm Delete</button>
        </AdminModal>
      ) : null}
    </section>
  );
}

function ActivityRows({ logs }) {
  return (
    <div className="admin-simple-table activity">
      <div><strong>Date & Time</strong><strong>Admin Name</strong><strong>Action</strong><strong>Target User</strong><strong>IP Address</strong></div>
      {logs.map((log) => (
        <div key={log.id}><span>{formatDateTime(log.dateTime)}</span><span>{log.adminName}</span><span>{log.action}</span><span>{log.targetUser}</span><span>{log.ipAddress}</span></div>
      ))}
      {logs.length === 0 ? <p className="admin-empty">No activity logs yet.</p> : null}
    </div>
  );
}

function SettingsForm({ settings, onSave, theme, onToggleTheme }) {
  const [form, setForm] = useState(settings);
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <form className="admin-panel admin-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div className="admin-section-head"><div><p>Settings</p><h3>System Configuration</h3></div><button type="button" onClick={onToggleTheme}><FaMoon /> {theme === "dark" ? "Light" : "Dark"} Mode</button></div>
      <div className="form-grid-2">
        <input type="number" value={form.trialPeriodDays} onChange={(event) => update({ trialPeriodDays: event.target.value })} placeholder="Trial Period Days" />
        <input value={form.defaultPlan} onChange={(event) => update({ defaultPlan: event.target.value })} placeholder="Default Subscription" />
        <input type="number" value={form.defaultDeviceLimit} onChange={(event) => update({ defaultDeviceLimit: event.target.value })} placeholder="Default Device Limit" />
        <input value={form.companyName} onChange={(event) => update({ companyName: event.target.value })} placeholder="Company Information" />
        <input value={form.smtpHost} onChange={(event) => update({ smtpHost: event.target.value })} placeholder="SMTP Host" />
        <input value={form.smtpEmail} onChange={(event) => update({ smtpEmail: event.target.value })} placeholder="SMTP Email" />
        <input value={form.brandColor} onChange={(event) => update({ brandColor: event.target.value })} placeholder="Brand Color" />
        <select value={form.backupFrequency} onChange={(event) => update({ backupFrequency: event.target.value })}>
          <option>Daily</option><option>Weekly</option><option>Monthly</option>
        </select>
        <select value={String(form.maintenanceMode)} onChange={(event) => update({ maintenanceMode: event.target.value === "true" })}>
          <option value="false">Maintenance Off</option><option value="true">Maintenance On</option>
        </select>
      </div>
      <button type="submit">Save Settings</button>
    </form>
  );
}
