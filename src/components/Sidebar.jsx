import {
  FaTachometerAlt,
  FaFileInvoice,
  FaUsers,
  FaBox,
  FaChartBar,
  FaCog,
} from "react-icons/fa";

const links = [
  { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { id: "billing", label: "Billing", icon: <FaFileInvoice /> },
  { id: "customers", label: "Customers", icon: <FaUsers /> },
  { id: "products", label: "Products", icon: <FaBox /> },
  { id: "reports", label: "Reports", icon: <FaChartBar /> },
  { id: "settings", label: "Settings", icon: <FaCog /> },
];

export default function Sidebar({ activePage, onChange }) {
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
          <span className="icon">{link.icon}</span>
          {link.label}
        </button>
      ))}
    </aside>
  );
}
