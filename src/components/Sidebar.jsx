import { useState, useEffect } from "react";
import {
  FaFileInvoice,
  FaUsers,
  FaTachometerAlt,
  FaBox,
  FaChartBar,
  FaCog,
  FaDownload,
  FaReceipt,
} from "react-icons/fa";
import logo from "../assets/VyaparOs.png";
import { useAppSettings } from "../utils/appSettings";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AS";

const links = [
  {
    id: "billing",
    label: "Billing",
    icon: <FaFileInvoice />,
    tone: "tone-billing",
  },
  {
    id: "sales",
    label: "Sales",
    icon: <FaReceipt />,
    tone: "tone-sales",
    subLinks: [
      { id: "sales-dashboard", label: "Sales Dashboard" },
      { id: "sales-quotation", label: "Quotation" },
      { id: "sales-taxInvoice", label: "Tax Invoice" },
      { id: "sales-debitNote", label: "Debit Note" },
      { id: "sales-creditNote", label: "Credit Note" },
      { id: "sales-deliveryChallan", label: "Delivery Challan" },
      { id: "sales-dummyInvoice", label: "Dummy Invoice" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: <FaUsers />,
    tone: "tone-customers",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <FaTachometerAlt />,
    tone: "tone-dashboard",
  },
  { id: "products", label: "Products", icon: <FaBox />, tone: "tone-products" },
  {
    id: "reports",
    label: "Reports",
    icon: <FaChartBar />,
    tone: "tone-reports",
  },
  { id: "settings", label: "Settings", icon: <FaCog />, tone: "tone-settings" },
  { id: "update", label: "Update", icon: <FaDownload />, tone: "tone-update" },
];

export default function Sidebar({ activePage, onChange, showUpdateDot }) {
  const { settings } = useAppSettings();
  const [salesExpanded, setSalesExpanded] = useState(() => {
    return activePage.startsWith("sales");
  });

  useEffect(() => {
    if (activePage.startsWith("sales")) {
      setSalesExpanded(true);
    }
  }, [activePage]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="VyapaarOS Logo" className="sidebar-logo" />
        <div>
          <h2>VyapaarOS</h2>
          <p>The Precision Atelier</p>
        </div>
      </div>
      <div className="sidebar-nav">
        {links.map((link) => {
          const isSales = link.id === "sales";
          const isActive = activePage === link.id || (isSales && activePage.startsWith("sales"));

          return (
            <div key={link.id} className="nav-group">
              <button
                className={
                  isActive
                    ? `nav-btn active ${link.tone}`
                    : `nav-btn ${link.tone}`
                }
                onClick={() => {
                  if (isSales) {
                    setSalesExpanded(!salesExpanded);
                    if (activePage === "sales" || !activePage.startsWith("sales-")) {
                      onChange("sales-dashboard");
                    }
                  } else {
                    onChange(link.id);
                  }
                }}
              >
                <span className="nav-btn-label">
                  <span className="icon-box">
                    <span className="icon">{link.icon}</span>
                  </span>
                  <span className="nav-text">{link.label}</span>
                </span>
                {isSales ? (
                  <span style={{ fontSize: "8px", opacity: 0.8 }}>{salesExpanded ? "▼" : "▶"}</span>
                ) : link.id === "update" && showUpdateDot ? (
                  <span className="nav-dot" />
                ) : null}
              </button>

              {isSales && salesExpanded && (
                <div className="sidebar-sub-nav">
                  {link.subLinks.map((sub) => {
                    const isSubActive = activePage === sub.id;
                    return (
                      <button
                        key={sub.id}
                        className={isSubActive ? "nav-sub-btn active" : "nav-sub-btn"}
                        onClick={() => onChange(sub.id)}
                      >
                        <span style={{ fontSize: "8px", opacity: 0.6 }}>•</span>
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-new-btn"
          onClick={() => onChange("sales-taxInvoice")}
        >
          + New Transaction
        </button>
        <div className="sidebar-profile">
          <span>{getInitials(settings.companyName || "Artisanal Shop")}</span>
          <div>
            <strong>{settings.companyName || "Artisanal Shop"}</strong>
            <small>Shopkeeper Profile</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
