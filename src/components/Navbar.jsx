import { useState, useEffect, useRef } from "react";
import { 
  FaBell, 
  FaCog, 
  FaQuestionCircle, 
  FaSearch, 
  FaUserCircle, 
  FaTimes,
  FaFileInvoice,
  FaTachometerAlt,
  FaReceipt,
  FaUsers,
  FaBox,
  FaChartBar,
  FaSlidersH
} from "react-icons/fa";

export default function Navbar({ user, onLogout, showUpdateDot, onChangePage }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const profileRef = useRef(null);

  // Close profile menu on clicking outside
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const handleForgotPassClick = () => {
    alert(`🔐 PASSWORD RETRIEVAL\n\nRegistered User: ${user?.email || "Unknown"}\nYour account password is: "${user?.password || "Not Set"}"`);
  };

  return (
    <>
      <header className="topbar">
        <label className="app-search">
          <FaSearch />
          <input placeholder="Search sales, clients, or invoices..." />
        </label>
        
        <div className="topbar-actions">
          
          {/* Notifications Bell */}
          <button 
            type="button" 
            title="Notifications / Updates" 
            onClick={() => onChangePage && onChangePage("update")}
            style={{ position: "relative" }}
          >
            <FaBell />
            {showUpdateDot && (
              <span 
                className="bell-red-dot" 
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  border: "1px solid #fff"
                }} 
              />
            )}
          </button>
          
          {/* Settings */}
          <button 
            type="button" 
            title="Settings"
            onClick={() => onChangePage && onChangePage("settings")}
          >
            <FaCog />
          </button>
          
          {/* Help */}
          <button 
            type="button" 
            title="Help Guide"
            onClick={() => setShowHelpModal(true)}
          >
            <FaQuestionCircle />
          </button>
          
          {/* User Profile */}
          <div style={{ position: "relative" }} ref={profileRef}>
            <button 
              type="button" 
              className="topbar-user" 
              title={user?.businessName || "Profile"} 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <FaUserCircle />
            </button>
            
            {profileMenuOpen && (
              <div 
                className="navbar-popover profile-popover" 
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  marginTop: "8px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "16px",
                  width: "240px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  zIndex: "999",
                  textAlign: "left"
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <small style={{ color: "#64748b", fontWeight: "700", display: "block", fontSize: "9px", letterSpacing: "0.5px" }}>
                    USER ID / EMAIL
                  </small>
                  <strong style={{ fontSize: "12px", color: "#1e293b", wordBreak: "break-all" }}>
                    {user?.email}
                  </strong>
                </div>
                
                <div style={{ marginBottom: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                  <button 
                    type="button" 
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#2563eb",
                      padding: "0",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "auto"
                    }}
                    onClick={handleForgotPassClick}
                  >
                    Forgot Password? (Reveal)
                  </button>
                </div>

                <button
                  type="button"
                  className="danger"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "12px",
                    padding: "8px",
                    borderRadius: "6px"
                  }}
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Help / Guide Modal */}
      {showHelpModal && (
        <div 
          className="help-modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 10000,
            padding: "20px"
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="help-modal-content"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
              padding: "24px",
              position: "relative",
              textAlign: "left"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "16px",
                marginBottom: "20px"
              }}
            >
              <h2 style={{ margin: 0, color: "#0f3f7a", fontSize: "20px", fontWeight: "800" }}>
                How to work this Billing System
              </h2>
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Help Content */}
            <div style={{ display: "grid", gap: "20px" }}>
              
              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", color: "#1266a8", marginTop: "3px" }}><FaTachometerAlt /></span>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700" }}>1. Dashboard Overview</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                    View real-time performance indices, monthly sales, pending transactions, and top client distributions at a single glance.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", color: "#1266a8", marginTop: "3px" }}><FaFileInvoice /></span>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700" }}>2. Create Invoices (Billing)</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                    Choose a client from the registry, specify standard/custom line items, enter dimensions in meters or inches, add extra terms, and click <strong>Save Invoice</strong>.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", color: "#1266a8", marginTop: "3px" }}><FaReceipt /></span>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700" }}>3. Sales Ledger Pages</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                    Review specific transaction pages for Quotations, Tax Invoices, Debit/Credit Notes, Delivery Challans, and Dummy Invoices. Access detail sheets, delete, or download them.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", color: "#1266a8", marginTop: "3px" }}><FaUsers /></span>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700" }}>4. Client Registry (Customers)</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                    Add or update your customers' registration files, including names, contact coordinates, shipping addresses, and GST numbers.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", color: "#1266a8", marginTop: "3px" }}><FaBox /></span>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700" }}>5. Product Catalogue</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                    Manage items for sale, standard pricing rates per meter, and descriptions. These auto-fill item details during the invoicing step.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", color: "#1266a8", marginTop: "3px" }}><FaSlidersH /></span>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700" }}>6. Business Profile Settings</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                    Update settings by clicking the gear icon to upload your business logo, digital signature image, bank account numbers, official contacts, and invoice badges.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", color: "#1266a8", marginTop: "3px" }}><FaChartBar /></span>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700" }}>7. Report Exports (PDF / CSV)</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                    Filter reports by custom range, download cumulative Leather Reports as PDFs, download sales lists as CSV files, or print invoices instantly.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div 
              style={{
                borderTop: "1px solid #f1f5f9",
                marginTop: "24px",
                paddingTop: "16px",
                textAlign: "center"
              }}
            >
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: "#1266a8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 24px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Got It, Thanks!
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
