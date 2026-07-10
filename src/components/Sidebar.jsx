import { useEffect, useState } from "react";
import {
  FaBox,
  FaChartBar,
  FaCog,
  FaDownload,
  FaFileInvoice,
  FaLandmark,
  FaMoneyBillWave,
  FaReceipt,
  FaShoppingCart,
  FaTachometerAlt,
  FaUserShield,
  FaUsers,
  FaWarehouse,
} from "react-icons/fa";
import logo from "../assets/VyaparOs.png";
import { useAppSettings } from "../utils/appSettings";
import { cloudAuth } from "../services/cloudAuthService";

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
    id: "purchase",
    label: "Purchase",
    icon: <FaShoppingCart />,
    tone: "tone-purchase",
    subLinks: [
      { id: "purchase-dashboard", label: "Purchase Dashboard" },
      { id: "purchase-invoice", label: "Tax Invoice" },
      { id: "purchase-creditNote", label: "Credit Note" },
      { id: "purchase-debitNote", label: "Debit Note" },
      { id: "purchase-quotation", label: "Quotation" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: <FaWarehouse />,
    tone: "tone-inventory",
    subLinks: [
      { id: "inventory", label: "Inventory Dashboard" },
      { id: "inventory-opening-main", label: "Opening Stock" },
      { id: "inventory-opening-add", label: "Add Opening Stock" },
      { id: "inventory-opening-list", label: "Opening Stock List" },
      { id: "inventory-purchase-entry", label: "Purchase Stock Entry" },
      { id: "inventory-sales-entry", label: "Sales Stock Entry" },
      { id: "inventory-stock-list", label: "Stock List" },
      { id: "inventory-stock-adjustment", label: "Stock Adjustment" },
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
  {
    id: "cash-bank",
    label: "Cash / Bank",
    icon: <FaMoneyBillWave />,
    tone: "tone-reports",
    subLinks: [
      { id: "cash-bank-dashboard", label: "Dashboard" },
      { id: "cash-bank-payment-entry", label: "Payment Entry" },
      { id: "cash-bank-payment-list", label: "Payment List" },
      { id: "cash-bank-payment-detail", label: "Payment Detail" },
      { id: "cash-bank-receipt-entry", label: "Receipt Entry" },
      { id: "cash-bank-receipt-list", label: "Receipt List" },
      { id: "cash-bank-receipt-detail", label: "Receipt Detail" },
      { id: "cash-bank-cash-report", label: "Cash Report" },
      { id: "cash-bank-bank-report", label: "Bank Report" },
      { id: "cash-bank-transaction-history", label: "Transaction History" },
    ],
  },
  {
    id: "gst",
    label: "GST",
    icon: <FaLandmark />,
    tone: "tone-reports",
    subLinks: [
      { id: "gst-dashboard", label: "GST Dashboard" },
      { id: "gst-gstr1-main", label: "GSTR-1 Main" },
      { id: "gst-gstr1-view", label: "GSTR-1 View" },
      { id: "gst-gstr1-customer-wise", label: "GSTR-1 Customer-wise" },
      { id: "gst-gstr1-download", label: "GSTR-1 Download" },
      { id: "gst-gstr2a-main", label: "GSTR-2A Main" },
      { id: "gst-gstr2a-summary", label: "GSTR-2A Summary" },
      { id: "gst-gstr2a-detail", label: "GSTR-2A Detail" },
    ],
  },
  { id: "settings", label: "Settings", icon: <FaCog />, tone: "tone-settings" },
  { id: "admin", label: "Admin Panel", icon: <FaUserShield />, tone: "tone-admin", ownerOnly: true },
  { id: "update", label: "Update", icon: <FaDownload />, tone: "tone-update" },
];

export default function Sidebar({ activePage, onChange, showUpdateDot, user }) {
  const { settings } = useAppSettings();
  const isOwner = cloudAuth.isOwnerUser(user);
  const [salesExpanded, setSalesExpanded] = useState(() => activePage.startsWith("sales"));
  const [purchaseExpanded, setPurchaseExpanded] = useState(() => activePage.startsWith("purchase"));
  const [inventoryExpanded, setInventoryExpanded] = useState(() => activePage.startsWith("inventory"));
  const [cashBankExpanded, setCashBankExpanded] = useState(() => activePage.startsWith("cash-bank"));
  const [gstExpanded, setGstExpanded] = useState(() => activePage.startsWith("gst"));

  useEffect(() => {
    if (activePage.startsWith("sales")) {
      setSalesExpanded(true);
    }
    if (activePage.startsWith("purchase")) {
      setPurchaseExpanded(true);
    }
    if (activePage.startsWith("inventory")) {
      setInventoryExpanded(true);
    }
    if (activePage.startsWith("cash-bank")) {
      setCashBankExpanded(true);
    }
    if (activePage.startsWith("gst")) {
      setGstExpanded(true);
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
        {links.filter((link) => !link.ownerOnly || isOwner).map((link) => {
          const isSales = link.id === "sales";
          const isPurchase = link.id === "purchase";
          const isInventory = link.id === "inventory";
          const isCashBank = link.id === "cash-bank";
          const isGst = link.id === "gst";
          const isExpandable = isSales || isPurchase || isInventory || isCashBank || isGst;
          const isExpanded = isSales
            ? salesExpanded
            : isPurchase
              ? purchaseExpanded
              : isInventory
                ? inventoryExpanded
                : isCashBank
                  ? cashBankExpanded
                  : gstExpanded;
          const isActive =
            activePage === link.id ||
            (isSales && activePage.startsWith("sales")) ||
            (isPurchase && activePage.startsWith("purchase")) ||
            (isInventory && activePage.startsWith("inventory")) ||
            (isCashBank && activePage.startsWith("cash-bank")) ||
            (isGst && activePage.startsWith("gst"));

          return (
            <div key={link.id} className="nav-group">
              <button
                className={isActive ? `nav-btn active ${link.tone}` : `nav-btn ${link.tone}`}
                onClick={() => {
                  if (isSales) {
                    setSalesExpanded(!salesExpanded);
                    if (activePage === "sales" || !activePage.startsWith("sales-")) {
                      onChange("sales-dashboard");
                    }
                    return;
                  }
                  if (isPurchase) {
                    setPurchaseExpanded(!purchaseExpanded);
                    if (activePage === "purchase" || !activePage.startsWith("purchase-")) {
                      onChange("purchase-dashboard");
                    }
                    return;
                  }
                  if (isInventory) {
                    setInventoryExpanded(!inventoryExpanded);
                    onChange("inventory");
                    return;
                  }
                  if (isCashBank) {
                    setCashBankExpanded(!cashBankExpanded);
                    onChange("cash-bank-dashboard");
                    return;
                  }
                  if (isGst) {
                    setGstExpanded(!gstExpanded);
                    onChange("gst-dashboard");
                    return;
                  }
                  onChange(link.id);
                }}
              >
                <span className="nav-btn-label">
                  <span className="icon-box">
                    <span className="icon">{link.icon}</span>
                  </span>
                  <span className="nav-text">{link.label}</span>
                </span>
                {isExpandable ? (
                  <span style={{ fontSize: "8px", opacity: 0.8 }}>{isExpanded ? "▼" : "▶"}</span>
                ) : link.id === "update" && showUpdateDot ? (
                  <span className="nav-dot" />
                ) : null}
              </button>

              {isExpandable && isExpanded ? (
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
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-new-btn"
          onClick={() => {
            if (activePage.startsWith("purchase")) {
              onChange("purchase-invoice");
            } else if (activePage.startsWith("inventory")) {
              onChange("inventory-opening-add");
            } else if (activePage.startsWith("cash-bank")) {
              onChange("cash-bank-receipt-entry");
            } else if (activePage.startsWith("gst")) {
              onChange("gst-gstr1-main");
            } else {
              onChange("sales-taxInvoice");
            }
          }}
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
