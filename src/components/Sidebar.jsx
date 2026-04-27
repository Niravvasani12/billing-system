import {
  FaFileInvoice,
  FaUsers,
  FaTachometerAlt,
  FaBox,
  FaChartBar,
  FaCog,
  FaDownload,
} from "react-icons/fa";

const links = [
  { id: "billing", label: "Billing", icon: <FaFileInvoice />, tone: "tone-billing" },
  { id: "customers", label: "Customers", icon: <FaUsers />, tone: "tone-customers" },
  { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt />, tone: "tone-dashboard" },
  { id: "products", label: "Products", icon: <FaBox />, tone: "tone-products" },
  { id: "reports", label: "Reports", icon: <FaChartBar />, tone: "tone-reports" },
  { id: "settings", label: "Settings", icon: <FaCog />, tone: "tone-settings" },
  { id: "update", label: "Update", icon: <FaDownload />, tone: "tone-update" },
];

export default function Sidebar({ activePage, onChange, showUpdateDot }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Billing Sys</h2>
        <div className="sidebar-accent" />
      </div>
      <div className="sidebar-nav">
        {links.map((link) => (
          <button
            key={link.id}
            className={activePage === link.id ? `nav-btn active ${link.tone}` : `nav-btn ${link.tone}`}
            onClick={() => onChange(link.id)}
          >
            <span className="nav-btn-label">
              <span className="icon-box">
                <span className="icon">{link.icon}</span>
              </span>
              <span className="nav-text">{link.label}</span>
            </span>
            {link.id === "update" && showUpdateDot ? <span className="nav-dot" /> : null}
          </button>
        ))}
      </div>
    </aside>
  );
}
