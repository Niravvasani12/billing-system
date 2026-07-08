import { useEffect, useState, useRef } from "react";
import {
  FaArrowLeft,
  FaPen,
  FaLock,
  FaStore,
  FaChevronDown,
  FaChevronUp,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaGlobe,
  FaCalendarAlt,
  FaUser,
  FaUniversity,
  FaCreditCard,
  FaCode,
  FaRegFileAlt,
  FaTicketAlt,
  FaSearch,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import {
  defaultAppSettings,
  resetAppSettings,
  useAppSettings,
} from "../utils/appSettings";

const businessTypes = [
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
  "Beauty Salon",
  "Other",
];

export default function Settings({ onChangePage }) {
  const { settings, saveSettings } = useAppSettings();
  const [form, setForm] = useState(settings);
  const [savedMsg, setSavedMsg] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");

  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  // Click outside to close custom dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async (e) => {
    if (e) e.preventDefault();
    await saveSettings(form);
    setSavedMsg("Settings saved. PDF will now use updated details.");
    setTimeout(() => {
      setSavedMsg("");
      if (onChangePage) {
        onChangePage("sales-dashboard");
      }
    }, 1200);
  };

  const onReset = async () => {
    const next = await resetAppSettings();
    setForm(next);
    setSavedMsg("Settings reset to default values.");
    setTimeout(() => setSavedMsg(""), 1800);
  };

  const onLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setField("pdfLogoDataUrl", reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const onSignatureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setField("pdfSignatureDataUrl", reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyReferral = () => {
    if (!form.friendReferralCode.trim()) {
      setReferralMessage("Please enter a valid code.");
      return;
    }
    setReferralApplied(true);
    setReferralMessage(
      "Referral Code applied successfully! 1 Month free Basic Plan activated!",
    );
    setTimeout(() => setReferralMessage(""), 4000);
  };

  const filteredBusinessTypes = businessTypes.filter((type) =>
    type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <section className="profile-page-container">
      <form onSubmit={onSave} className="stack">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-left">
            <button
              type="button"
              className="back-btn"
              onClick={() => onChangePage && onChangePage("sales-dashboard")}
              title="Go back to Dashboard"
            >
              <FaArrowLeft />
            </button>
            <h1 className="profile-title">Business Profile</h1>
          </div>
          <button type="submit" className="edit-btn">
            <FaPen /> EDIT
          </button>
        </div>

        {/* Upload Logo / Signature Panel */}
        <div className="upload-card-container">
          {/* Logo Box */}
          <div
            className="upload-box"
            onClick={() => logoInputRef.current?.click()}
            title="Click to add logo"
          >
            <input
              type="file"
              ref={logoInputRef}
              style={{ display: "none" }}
              accept="image/png,image/jpeg,image/webp"
              onChange={onLogoChange}
            />
            {form.pdfLogoDataUrl ? (
              <>
                <img src={form.pdfLogoDataUrl} alt="Logo" />
                <button
                  type="button"
                  className="upload-box-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setField("pdfLogoDataUrl", "");
                  }}
                  title="Remove Logo"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                <div className="upload-box-icon">
                  <FaLock />
                </div>
                <span className="upload-box-text">Add Logo</span>
              </>
            )}
          </div>

          {/* Signature Box */}
          <div
            className="upload-box"
            onClick={() => signatureInputRef.current?.click()}
            title="Click to add signature"
          >
            <input
              type="file"
              ref={signatureInputRef}
              style={{ display: "none" }}
              accept="image/png,image/jpeg,image/webp"
              onChange={onSignatureChange}
            />
            {form.pdfSignatureDataUrl ? (
              <>
                <img src={form.pdfSignatureDataUrl} alt="Signature" />
                <button
                  type="button"
                  className="upload-box-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setField("pdfSignatureDataUrl", "");
                  }}
                  title="Remove Signature"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                <div className="upload-box-icon">
                  <FaLock />
                </div>
                <span className="upload-box-text">Add Signature</span>
              </>
            )}
          </div>
        </div>

        {/* IDENTITY */}
        <div className="profile-section">
          <div className="profile-section-title">Identity</div>
          <div className="profile-card">
            <div className="input-with-icon-wrapper">
              <label className="input-label">Business / Trading Name *:</label>
              <div className="input-with-icon">
                <span className="input-icon-box">
                  <FaStore />
                </span>
                <input
                  type="text"
                  required
                  value={form.companyName || ""}
                  onChange={(e) => setField("companyName", e.target.value)}
                  placeholder="Business / Trading Name"
                />
              </div>
            </div>

            {/* <div className="input-with-icon-wrapper">
              <label className="input-label">Business Type * (Locked):</label>
              <div className="custom-dropdown-container" ref={dropdownRef}>
                <button
                  type="button"
                  className={`custom-dropdown-trigger ${dropdownOpen ? "open" : ""}`}
                  onClick={() => !settings?.businessType && setDropdownOpen(!dropdownOpen)}
                  disabled={Boolean(settings?.businessType)}
                  style={settings?.businessType ? { cursor: "not-allowed", opacity: 0.8, backgroundColor: "var(--border-lite, #f1f5f9)" } : {}}
                  title={settings?.businessType ? "Business type is locked and cannot be changed" : ""}
                >
                  <span>{form.businessType || "Select an option"}</span>
                  <span className="custom-dropdown-arrow">
                    {settings?.businessType ? (
                      <FaLock size={11} style={{ color: "#64748b" }} />
                    ) : dropdownOpen ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="custom-dropdown-menu">
                    <div className="dropdown-search-wrapper" onClick={(e) => e.stopPropagation()}>
                      <span className="dropdown-search-icon"><FaSearch /></span>
                      <input
                        type="text"
                        className="dropdown-search-input"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="dropdown-options-list">
                      {filteredBusinessTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`dropdown-option ${form.businessType === type ? "selected" : ""}`}
                          onClick={() => {
                            setField("businessType", type);
                            setDropdownOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          {type}
                        </button>
                      ))}
                      {filteredBusinessTypes.length === 0 && (
                        <div style={{ padding: "10px 14px", fontSize: "12px", color: "#64748b" }}>
                          No options found
                        </div>
                      )}
                    </div>
                    <div className="dropdown-footer-warning">
                      <span className="dropdown-warning-icon"><FaExclamationTriangle /></span>
                      <span>This cannot be changed later. Choose carefully.</span>
                    </div>
                  </div>
                )}
              </div>
            </div> */}

            <div className="profile-grid-2">
              <div className="input-with-icon-wrapper">
                <label className="input-label">Contact Number *:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaPhoneAlt />
                  </span>
                  <input
                    type="text"
                    required
                    value={form.mobile || ""}
                    onChange={(e) => setField("mobile", e.target.value)}
                    placeholder="Contact Number *"
                  />
                </div>
              </div>

              <div className="input-with-icon-wrapper">
                <label className="input-label">Official Email *:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email || ""}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="Official Email *"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT DETAILS */}
        <div className="profile-section">
          <div className="profile-section-title">
            Contact Details & Settings
          </div>
          <div className="profile-card">
            <div className="input-with-icon-wrapper">
              <label className="input-label">Address:</label>
              <div className="input-with-icon">
                <span className="input-icon-box">
                  <FaMapMarkerAlt />
                </span>
                <input
                  type="text"
                  value={form.address || ""}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Address"
                />
              </div>
            </div>

            <div className="profile-grid-2">
              <div className="input-with-icon-wrapper">
                <label className="input-label">GSTIN:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaIdCard />
                  </span>
                  <input
                    type="text"
                    value={form.gstin || ""}
                    onChange={(e) => setField("gstin", e.target.value)}
                    placeholder="GSTIN"
                  />
                </div>
              </div>

              <div className="input-with-icon-wrapper">
                <label className="input-label">Place of Supply:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaGlobe />
                  </span>
                  <input
                    type="text"
                    value={form.placeOfSupply || ""}
                    onChange={(e) => setField("placeOfSupply", e.target.value)}
                    placeholder="Place of Supply"
                  />
                </div>
              </div>
            </div>

            <div className="profile-grid-2">
              <div className="input-with-icon-wrapper">
                <label className="input-label">Due Days:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaCalendarAlt />
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.dueDays || ""}
                    onChange={(e) => setField("dueDays", e.target.value)}
                    placeholder="Due Days"
                  />
                </div>
              </div>

              <div className="input-with-icon-wrapper">
                <label className="input-label">PDF Header Badge:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaRegFileAlt />
                  </span>
                  <input
                    type="text"
                    value={form.pdfBadge || ""}
                    onChange={(e) => setField("pdfBadge", e.target.value)}
                    placeholder="PDF Badge Text"
                  />
                </div>
              </div>
            </div>

            <div className="profile-grid-2">
              <div className="input-with-icon-wrapper">
                <label className="input-label">Authorised Title:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaRegFileAlt />
                  </span>
                  <input
                    type="text"
                    value={form.authorisedTitle || ""}
                    onChange={(e) =>
                      setField("authorisedTitle", e.target.value)
                    }
                    placeholder="Authorised Title"
                  />
                </div>
              </div>

              <div className="input-with-icon-wrapper">
                <label className="input-label">
                  Authorised Signatory Name:
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    value={form.authorisedName || ""}
                    onChange={(e) => setField("authorisedName", e.target.value)}
                    placeholder="Authorised Name"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BANK DETAILS */}
        <div className="profile-section">
          <div className="profile-section-title">Bank Details</div>
          <div className="profile-card">
            <div className="profile-grid-2">
              <div className="input-with-icon-wrapper">
                <label className="input-label">Account Holder Name:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    value={form.accountName || ""}
                    onChange={(e) => setField("accountName", e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div className="input-with-icon-wrapper">
                <label className="input-label">Bank Name:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaUniversity />
                  </span>
                  <input
                    type="text"
                    value={form.bankName || ""}
                    onChange={(e) => setField("bankName", e.target.value)}
                    placeholder="e.g. State Bank of India"
                  />
                </div>
              </div>
            </div>

            <div className="profile-grid-2">
              <div className="input-with-icon-wrapper">
                <label className="input-label">Account Number:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaCreditCard />
                  </span>
                  <input
                    type="text"
                    value={form.accountNo || ""}
                    onChange={(e) => setField("accountNo", e.target.value)}
                    placeholder="e.g. 1234567890"
                  />
                </div>
              </div>

              <div className="input-with-icon-wrapper">
                <label className="input-label">IFSC Code:</label>
                <div className="input-with-icon">
                  <span className="input-icon-box">
                    <FaCode />
                  </span>
                  <input
                    type="text"
                    value={form.ifsc || ""}
                    onChange={(e) => setField("ifsc", e.target.value)}
                    placeholder="e.g. SBIN0001234"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ADDITIONAL NOTES & TERMS */}
        <div className="profile-section">
          <div className="profile-section-title">Additional Notes & Terms</div>
          <div className="profile-card">
            <div className="input-with-icon-wrapper">
              <label className="input-label">Additional Notes & Terms:</label>
              <div className="input-with-icon">
                <span
                  className="input-icon-box"
                  style={{ alignSelf: "flex-start", marginTop: "12px" }}
                >
                  <FaRegFileAlt />
                </span>
                <textarea
                  value={form.terms || ""}
                  onChange={(e) => setField("terms", e.target.value)}
                  placeholder="e.g. Table 5, Serial No: 123, No Return Policy, etc."
                  rows={4}
                />
              </div>
            </div>

            <div className="card-footnote">
              These details will appear on your generated invoices.
            </div>
          </div>
        </div>

        {/* REFERRAL PROGRAM */}
        <div className="profile-section">
          <div className="profile-section-title">Referral Program</div>
          <div className="profile-card">
            <div className="input-with-icon-wrapper">
              <label className="input-label">Friend's Referral Code:</label>
              <div className="referral-input-group">
                <div className="input-with-icon" style={{ width: "100%" }}>
                  <span className="input-icon-box">
                    <FaTicketAlt />
                  </span>
                  <input
                    type="text"
                    value={form.friendReferralCode || ""}
                    onChange={(e) =>
                      setField("friendReferralCode", e.target.value)
                    }
                    placeholder="e.g. ABC123DE"
                    disabled={referralApplied}
                  />
                </div>
                <button
                  type="button"
                  className="referral-apply-btn"
                  onClick={handleApplyReferral}
                  disabled={referralApplied || !form.friendReferralCode?.trim()}
                >
                  APPLY
                </button>
              </div>
            </div>

            {referralMessage && (
              <div
                style={{
                  fontSize: "12px",
                  color: referralApplied ? "#10b981" : "#ef4444",
                  fontWeight: "600",
                }}
              >
                {referralMessage}
              </div>
            )}

            <div className="card-footnote" style={{ marginTop: "0" }}>
              Enter a friend's code to get 1 Month Basic Plan for free
              Instantly!
            </div>
          </div>
        </div>

        {/* Main Save / Reset Actions */}
        <div className="profile-actions">
          <button type="submit" className="profile-apply-btn">
            APPLY
          </button>
        </div>

        {savedMsg && (
          <div
            style={{
              textAlign: "center",
              color: "#10b981",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            {savedMsg}
          </div>
        )}
      </form>
    </section>
  );
}
