import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice } from "../store/slices/invoiceSlice";
import { formatCurrency } from "../utils/formatCurrency";
import BillPreview from "../components/BillPreview";
import { useAppSettings } from "../utils/appSettings";

const INDUSTRY_UNITS = {
  "Jewellery": ["Gram", "Kg"],
  "Textile": ["Piece", "Meter", "Roll"],
  "Grocery": ["Piece", "Kg", "Gram", "Liter", "Packet"],
  "Hardware": ["Piece", "Box"],
  "DTF Printing": ["Sq. Ft.", "Sq. Meter"],
  "Electronics": ["Piece"],
  "Pharmacy": ["Strip", "Box", "Bottle", "Tablet"],
  "Furniture": ["Piece"],
  "Automobile Parts": ["Piece", "Set"],
  "Restaurant": ["Table", "Item"],
  "Bakery": ["Piece", "Kg", "Gram"],
  "Cafe": ["Cup", "Glass", "Piece"],
  "Mobile Shop": ["Piece"],
  "Computer": ["Piece"],
  "Paint Shop": ["Litre", "Can"],
  "Steel": ["Kg", "Ton"],
  "Tiles & Marble": ["Box", "Sq. Ft."],
  "Plywood": ["Sheet", "Piece"],
  "Stationery": ["Piece", "Box"],
  "Book Store": ["Piece"],
  "Gift Shop": ["Piece"],
  "Footwear": ["Pair", "Piece"],
  "Boutique": ["Piece"],
  "Tailor": ["Piece"],
  "Optical": ["Piece", "Pair"],
  "Sweet Mart": ["Kg", "Gram"],
  "Dairy": ["Litre", "Kg", "Packet"],
  "Clinic": ["Service", "Consultation"],
  "Hospital": ["Service", "Bed", "Day"],
  "Diagnostic": ["Test", "Service"],
  "IT Company": ["Project", "Hour", "Month"],
  "Digital Marketing": ["Project", "Month"],
  "Consultancy": ["Hour", "Service"],
  "Gym": ["Member", "Month"],
  "Beauty Salon": ["Service", "Item"]
};

const getEmptyItem = (ind) => ({
  description: "",
  quantity: 0,
  unit: INDUSTRY_UNITS[ind]?.[0] || "Piece",
  pricePerMeter: 0,
  width: "",
  height: "",
  makingCharges: 0,
  serialNumber: "",
  batchNo: "",
  expiryDate: "",
  mrp: "",
  partNumber: "",
  industry: ind
});

const getDetailLabel = (ind) => {
  switch (ind) {
    case "Book Store": return "ISBN";
    case "Footwear": return "Size";
    case "Boutique": return "Size & Color";
    case "Tailor": return "Measurements";
    case "Optical": return "Lens & Frame Details";
    case "Automobile Parts": return "Part Number";
    case "Mobile Shop": return "IMEI / Serial";
    case "Paint Shop": return "Shade / Code";
    case "Restaurant": return "Table / KOT Number";
    case "Clinic": return "Consultation Details";
    case "Hospital": return "Patient & Bed Info";
    case "Diagnostic": return "Test Code";
    case "IT Company": return "Project Details";
    case "Digital Marketing": return "Campaign Details";
    case "Consultancy": return "Consultation Type";
    case "Gym": return "Membership duration";
    case "Beauty Salon": return "Stylist / Staff Name";
    case "Electronics":
    case "Computer":
      return "Serial / Warranty Number";
    default:
      return null;
  }
};

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Billing({ user }) {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customer.items);
  const products = useSelector((state) => state.product.items);
  const invoices = useSelector((state) => state.invoice.items);
  
  const { settings } = useAppSettings();
  const [customerId, setCustomerId] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [invoiceDate, setInvoiceDate] = useState(toInputDate());
  const [notes, setNotes] = useState("");
  
  const [industry, setIndustry] = useState("Textile");
  const [items, setItems] = useState([]);
  const [latestInvoice, setLatestInvoice] = useState(null);

  // Sync default industry from profile settings
  useEffect(() => {
    if (settings?.businessType && INDUSTRY_UNITS[settings.businessType]) {
      setIndustry(settings.businessType);
      setItems([getEmptyItem(settings.businessType)]);
    } else {
      setItems([getEmptyItem("Textile")]);
    }
  }, [settings?.businessType]);

  const handleIndustryChange = (nextInd) => {
    setIndustry(nextInd);
    setItems([getEmptyItem(nextInd)]);
  };

  const invoiceNo = useMemo(() => {
    const maxInvoiceNo = invoices.reduce((max, inv) => {
      const value = Number(inv?.invoiceNo);
      return Number.isInteger(value) && value > max ? value : max;
    }, 0);
    return String(maxInvoiceNo + 1);
  }, [invoices]);

  const summary = useMemo(() => {
    const normalized = items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.pricePerMeter || 0);
      const makingCharges = Number(item.makingCharges || 0);
      const width = Number(item.width || 0);
      const height = Number(item.height || 0);
      
      let meters = quantity;
      let lineTotal = 0;

      switch (industry) {
        case "Jewellery":
        case "Furniture":
          lineTotal = (price * quantity) + makingCharges;
          meters = quantity;
          break;
        case "DTF Printing":
        case "Tiles & Marble":
          const unitLower = (item.unit || "").toLowerCase();
          if (unitLower === "sq. meter" || unitLower === "sq. mtr" || unitLower === "sq meter") {
            const area = (width * height * 0.00064516) * quantity;
            meters = Number(area.toFixed(4));
          } else if (unitLower === "sq. ft." || unitLower === "sq.ft" || unitLower === "sq ft") {
            const area = (width * height / 144) * quantity;
            meters = Number(area.toFixed(4));
          } else {
            meters = quantity;
          }
          lineTotal = meters * price;
          break;
        case "Grocery":
        case "Sweet Mart":
          if ((item.unit || "").toLowerCase() === "gram") {
            lineTotal = (quantity / 1000) * price;
          } else {
            lineTotal = quantity * price;
          }
          meters = quantity;
          break;
        default:
          lineTotal = quantity * price;
          meters = quantity;
          break;
      }
      return { ...item, meters, lineTotal };
    });

    const subtotal = normalized.reduce((sum, item) => sum + item.lineTotal, 0);
    const gstAmount = (subtotal * Number(gstPercent || 0)) / 100;
    const total = subtotal + gstAmount;
    return { normalized, subtotal, gstAmount, total };
  }, [items, gstPercent, industry]);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...getEmptyItem(industry) }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const selectProduct = (index, productId) => {
    const selected = products.find((p) => String(p.id) === productId);
    updateItem(index, {
      description: selected ? selected.name : "",
      pricePerMeter: selected ? selected.pricePerMeter : 0
    });
  };

  const handleSave = async () => {
    const payload = {
      customerId: customerId ? Number(customerId) : null,
      gstPercent: Number(gstPercent || 0),
      invoiceDate,
      notes,
      items: summary.normalized.filter((item) => Number(item.quantity) > 0 || ((industry === "DTF Printing" || industry === "Tiles & Marble") && Number(item.width) > 0)),
      industry
    };
    const action = await dispatch(addInvoice({ payload, userId: user?.id }));
    if (action?.payload) {
      setLatestInvoice(action.payload);
    }
    setItems([getEmptyItem(industry)]);
    setNotes("");
    setCustomerId("");
    setInvoiceDate(toInputDate());
  };

  const previewCustomer = useMemo(() => {
    if (!latestInvoice?.customerId) return null;
    return customers.find((c) => c.id === latestInvoice.customerId) || null;
  }, [customers, latestInvoice]);

  return (
    <section className="stack">
      <div className="panel" style={{ borderLeft: "4px solid var(--accent-billing, #0ea5e9)", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>Create Invoice ({invoiceNo})</h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>Industry Mode:</span>
            <select 
              value={industry} 
              onChange={(e) => handleIndustryChange(e.target.value)} 
              style={{ width: "auto", minWidth: "180px", padding: "6px 10px", fontSize: "13px" }}
            >
              {Object.keys(INDUSTRY_UNITS).map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2" style={{ marginTop: "8px" }}>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "10px" }}>
            <input type="number" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} placeholder="GST %" style={{ flex: 1 }} />
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {items.map((item, index) => {
          const quantity = Number(item.quantity || 0);
          const price = Number(item.pricePerMeter || 0);
          
          // Local calculations for real-time display in the card
          let lineMeters = quantity;
          let lineTotal = 0;
          
          if (industry === "Jewellery" || industry === "Furniture") {
            lineMeters = quantity;
            lineTotal = (price * quantity) + Number(item.makingCharges || 0);
          } else if (industry === "DTF Printing" || industry === "Tiles & Marble") {
            const width = Number(item.width || 0);
            const height = Number(item.height || 0);
            const unitLower = (item.unit || "").toLowerCase();
            if (unitLower === "sq. meter" || unitLower === "sq. mtr" || unitLower === "sq meter") {
              lineMeters = (width * height * 0.00064516) * quantity;
            } else if (unitLower === "sq. ft." || unitLower === "sq.ft" || unitLower === "sq ft") {
              lineMeters = (width * height / 144) * quantity;
            } else {
              lineMeters = quantity;
            }
            lineTotal = lineMeters * price;
          } else if ((industry === "Grocery" || industry === "Sweet Mart") && (item.unit || "").toLowerCase() === "gram") {
            lineMeters = quantity;
            lineTotal = (quantity / 1000) * price;
          } else {
            lineMeters = quantity;
            lineTotal = quantity * price;
          }

          const detailsLabel = getDetailLabel(industry);

          return (
            <div className="panel" key={index} style={{ borderLeft: "4px solid var(--brand)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--brand)" }}>Line Item #{index + 1}</span>
                <button type="button" className="danger" onClick={() => removeItem(index)} style={{ width: "auto", padding: "4px 10px", fontSize: "12px" }}>Remove</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                
                {/* Product Selection */}
                <div>
                  <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Select Product</label>
                  <select onChange={(e) => selectProduct(index, e.target.value)} defaultValue="">
                    <option value="">Search Product...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Custom Description */}
                <div>
                  <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Item Description</label>
                  <input
                    placeholder="Description / Custom Name"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                  />
                </div>

                {/* Jewellery & Furniture Dynamic Fields */}
                {(industry === "Jewellery" || industry === "Furniture") && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>
                        {industry === "Jewellery" ? "Weight" : "Quantity"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder={industry === "Jewellery" ? "Weight" : "Quantity"}
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Unit</label>
                      <select value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })}>
                        {INDUSTRY_UNITS[industry].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Price / Unit</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.pricePerMeter || ""}
                        onChange={(e) => updateItem(index, { pricePerMeter: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>
                        {industry === "Jewellery" ? "Making Charges (₹)" : "Delivery Charges (₹)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={industry === "Jewellery" ? "Making" : "Delivery"}
                        value={item.makingCharges || ""}
                        onChange={(e) => updateItem(index, { makingCharges: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* DTF & Tiles Dynamic Fields */}
                {(industry === "DTF Printing" || industry === "Tiles & Marble") && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Width (inches)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Width"
                        value={item.width || ""}
                        onChange={(e) => updateItem(index, { width: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Height (inches)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Height"
                        value={item.height || ""}
                        onChange={(e) => updateItem(index, { height: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Quantity</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Unit</label>
                      <select value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })}>
                        {INDUSTRY_UNITS[industry].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Price / Sq. Unit</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Rate"
                        value={item.pricePerMeter || ""}
                        onChange={(e) => updateItem(index, { pricePerMeter: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Batch & Expiry (Pharmacy, Grocery, Dairy) */}
                {(industry === "Pharmacy" || industry === "Grocery" || industry === "Dairy") && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Quantity</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Unit</label>
                      <select value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })}>
                        {INDUSTRY_UNITS[industry].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Price / Unit</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.pricePerMeter || ""}
                        onChange={(e) => updateItem(index, { pricePerMeter: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>MRP (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="MRP"
                        value={item.mrp || ""}
                        onChange={(e) => updateItem(index, { mrp: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Batch No</label>
                      <input
                        placeholder="Batch No"
                        value={item.batchNo || ""}
                        onChange={(e) => updateItem(index, { batchNo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Expiry Date</label>
                      <input
                        placeholder="Exp (MM/YY)"
                        value={item.expiryDate || ""}
                        onChange={(e) => updateItem(index, { expiryDate: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Standard/Others (no custom tags) */}
                {industry !== "Jewellery" && industry !== "Furniture" && industry !== "DTF Printing" && industry !== "Tiles & Marble" && industry !== "Pharmacy" && industry !== "Grocery" && industry !== "Dairy" && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Quantity</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Quantity"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Unit</label>
                      <select value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })}>
                        {(INDUSTRY_UNITS[industry] || ["Piece"]).map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Price / Unit</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Rate"
                        value={item.pricePerMeter || ""}
                        onChange={(e) => updateItem(index, { pricePerMeter: e.target.value })}
                      />
                    </div>

                    {/* Mapped Dynamic Subtitle Input for specific categories */}
                    {detailsLabel && (
                      <div>
                        <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>{detailsLabel}</label>
                        <input
                          placeholder={`Enter ${detailsLabel}...`}
                          value={item.serialNumber || ""}
                          onChange={(e) => updateItem(index, { serialNumber: e.target.value })}
                        />
                      </div>
                    )}
                  </>
                )}

              </div>

              {/* Real-time details summary block inside card */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", background: "var(--border-lite, #f8fafc)", padding: "10px 14px", borderRadius: "6px", marginTop: "4px", border: "1px solid var(--border)" }}>
                {(industry === "DTF Printing" || industry === "Tiles & Marble") && (
                  <div style={{ fontSize: "13px", color: "#334155" }}>
                    Computed Area: <strong>{lineMeters.toFixed(3)}</strong> {item.unit}
                  </div>
                )}
                {industry === "Jewellery" && (
                  <div style={{ fontSize: "13px", color: "#334155" }}>
                    Weight: <strong>{lineMeters.toFixed(3)}</strong> {item.unit}
                  </div>
                )}
                {industry === "Grocery" && (
                  <div style={{ fontSize: "13px", color: "#334155" }}>
                    Quantity: <strong>{lineMeters}</strong> {item.unit}
                  </div>
                )}
                <div style={{ marginLeft: "auto", fontSize: "13px", color: "#0f172a" }}>
                  Taxable Amount: <strong style={{ color: "var(--brand)" }}>{formatCurrency(lineTotal || 0)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={addItem} className="secondary" style={{ width: "fit-content", padding: "10px 20px" }}>+ Add Line Item</button>

      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <textarea placeholder="Terms or Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" />
        
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div className="summary" style={{ minWidth: "260px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal:</span><strong>{formatCurrency(summary.subtotal)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>GST ({gstPercent}%):</span><strong>{formatCurrency(summary.gstAmount)}</strong>
            </div>
            <hr style={{ margin: "4px 0", borderColor: "var(--border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px" }}>
              <span>Total:</span><strong>{formatCurrency(summary.total)}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={handleSave} style={{ width: "auto", padding: "12px 28px", fontSize: "15px", fontWeight: "600" }}>Save & Generate Invoice</button>
        </div>
      </div>

      <BillPreview invoice={latestInvoice} customer={previewCustomer} />
    </section>
  );
}
