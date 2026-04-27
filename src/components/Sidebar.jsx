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
  { id: "billing", label: "Billing", icon: <FaFileInvoice /> },
  { id: "customers", label: "Customers", icon: <FaUsers /> },
  { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { id: "products", label: "Products", icon: <FaBox /> },
  { id: "reports", label: "Reports", icon: <FaChartBar /> },
  { id: "settings", label: "Settings", icon: <FaCog /> },
  { id: "update", label: "Update", icon: <FaDownload /> },
];

export default function Sidebar({ activePage, onChange, showUpdateDot }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Billing Sys</h2>
      </div>

      {links.map((link) => (
        <button
          key={link.id}
          className={activePage === link.id ? "nav-btn active" : "nav-btn"}
          onClick={() => onChange(link.id)}
        >
          <span className="nav-btn-label">
            <span className="icon">{link.icon}</span>
            {link.label}
          </span>
          {link.id === "update" && showUpdateDot ? <span className="nav-dot" /> : null}
        </button>
      ))}
    </aside>
  );
}
