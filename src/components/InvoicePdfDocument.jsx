import logo from "../assets/logo.png";
import { useAppSettings } from "../utils/appSettings";
import { formatCurrency } from "../utils/formatCurrency";
import { numberToWordsIndian } from "../utils/numberToWords";
import { parseSafeDate, formatDate } from "../utils/dateUtils";

const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
};

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

export default function InvoicePdfDocument({
  invoice,
  customer,
  elementId = "bill-pdf",
  containerClass = "pdf-only"
}) {
  const { settings } = useAppSettings();
  if (!invoice) return null;

  const createdDate = parseSafeDate(invoice.createdAt);
  const dueDate = addDays(createdDate, Number(settings.dueDays || 7));
  const items = invoice.items || [];
  const totalMeters = items.reduce((sum, item) => sum + Number(item.meters || 0), 0);
  const minItemRows = 8;
  const fillerRows = Math.max(0, minItemRows - items.length);

  const termsList = [];
  if (settings.terms && settings.terms.trim()) {
    settings.terms.split("\n").forEach((line) => {
      if (line.trim()) {
        termsList.push(line.trim());
      }
    });
  } else {
    if (settings.terms1) termsList.push(settings.terms1);
    if (settings.terms2) termsList.push(settings.terms2);
  }

  return (
    <div className={containerClass}>
      <div id={elementId} className="invoice-sheet">
        <div className="inv-top-strip">
          <span>TAX INVOICE</span>
          <span className="inv-tag">{settings.pdfBadge || "ORIGINAL FOR RECIPIENT"}</span>
        </div>

        <div className="inv-company-row">
          <img src={settings.pdfLogoDataUrl || logo} alt="Company Logo" className="inv-logo-img" />
          <div>
            <h1>{settings.companyName}</h1>
            <p>{settings.address}</p>
            <p><strong>Mobile:</strong> {settings.mobile} &nbsp;&nbsp; <strong>GSTIN:</strong> {settings.gstin}</p>
            <p><strong>Email:</strong> {settings.email}</p>
          </div>
        </div>

        <div className="inv-meta-row">
          <p><strong>Invoice No.:</strong> {invoice.invoiceNo}</p>
          <p><strong>Invoice Date:</strong> {formatDate(createdDate)}</p>
          <p><strong>Due Date:</strong> {formatDate(dueDate)}</p>
        </div>

        <div className="inv-bill-ship-grid">
          <div>
            <h3>BILL TO</h3>
            <p><strong>{customer?.name || "Walk-in Customer"}</strong></p>
            <p>{customer?.address || settings.address}</p>
            <p>Mobile: {customer?.phone || "-"}</p>
            <p>GSTIN: {customer?.gstin || "-"}</p>
            <p>Place of Supply: {settings.placeOfSupply}</p>
          </div>
          <div>
            <h3>SHIP TO</h3>
            <p><strong>{customer?.name || "Walk-in Customer"}</strong></p>
            <p>{customer?.address || settings.address}</p>
            <p>Mobile: {customer?.phone || "-"}</p>
            <p>GSTIN: {customer?.gstin || "-"}</p>
            <p>Place of Supply: {settings.placeOfSupply}</p>
          </div>
        </div>

        <table className="inv-items-table">
          <thead>
            <tr>
              <th>ITEMS</th>
              <th>QTY.</th>
              <th>RATE</th>
              <th>TAX</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${invoice.id}-${index}`}>
                <td>
                  <div style={{ fontWeight: "600" }}>{item.description || "Untitled Item"}</div>
                  {/* Extra charges */}
                  {item.industry === "Jewellery" && Number(item.makingCharges || 0) > 0 && (
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                      Making Charges: {formatCurrency(item.makingCharges)}
                    </div>
                  )}
                  {item.industry === "Furniture" && Number(item.makingCharges || 0) > 0 && (
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                      Delivery Charges: {formatCurrency(item.makingCharges)}
                    </div>
                  )}
                  {/* Dimensions */}
                  {(item.industry === "DTF Printing" || item.industry === "Tiles & Marble") && (
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                      Size: {item.width}" x {item.height}"
                    </div>
                  )}
                  {/* Batch / Expiry / MRP tags */}
                  {(item.industry === "Pharmacy" || item.industry === "Grocery" || item.industry === "Dairy") && (
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                      Batch: {item.batchNo || "-"} &nbsp;|&nbsp; Exp: {item.expiryDate || "-"} &nbsp;|&nbsp; MRP: {formatCurrency(item.mrp || 0)}
                    </div>
                  )}
                  {/* Custom Detail tag */}
                  {getDetailLabel(item.industry) && item.serialNumber && (
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                      {getDetailLabel(item.industry)}: {item.serialNumber}
                    </div>
                  )}
                </td>
                <td>
                  {item.industry === "DTF Printing" || item.industry === "Tiles & Marble" ? (
                    `${Number(item.meters || 0).toFixed(2)} ${item.unit || "Sq. Ft."}`
                  ) : item.industry === "Jewellery" ? (
                    `${Number(item.quantity || 0).toFixed(3)} ${item.unit || "Gram"}`
                  ) : (
                    `${Number(item.quantity || 0)} ${item.unit || "Piece"}`
                  )}
                </td>
                <td>{formatCurrency(item.pricePerMeter)}</td>
                <td>{formatCurrency((Number(item.lineTotal) * Number(invoice.gstPercent || 0)) / 100)} ({invoice.gstPercent}%)</td>
                <td>{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td>NO ITEMS</td>
                <td>0</td>
                <td>{formatCurrency(0)}</td>
                <td>{formatCurrency(0)} ({invoice.gstPercent}%)</td>
                <td>{formatCurrency(0)}</td>
              </tr>
            )}
            {Array.from({ length: fillerRows }).map((_, index) => (
              <tr key={`filler-${index}`} className="inv-filler-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-subtotal-row">
          <strong>SUBTOTAL (Total Items: {items.length})</strong>
          <strong></strong>
          <strong>{formatCurrency(invoice.gstAmount)}</strong>
          <strong>{formatCurrency(invoice.total)}</strong>
        </div>

        <div className="inv-bank-total-grid">
          <div>
            <h3>BANK DETAILS</h3>
            <p><strong>Name:</strong> {settings.accountName}</p>
            <p><strong>IFSC Code:</strong> {settings.ifsc}</p>
            <p><strong>Account No:</strong> {settings.accountNo}</p>
            <p><strong>Bank:</strong> {settings.bankName}</p>

            <h3>TERMS AND CONDITIONS</h3>
            {termsList.map((term, idx) => (
              <p key={idx}>{idx + 1}. {term}</p>
            ))}
          </div>
          <div className="inv-amount-box">
            <p><span>Taxable Amount</span><span>{formatCurrency(invoice.subtotal)}</span></p>
            <p><span>CGST @{Number(invoice.gstPercent / 2).toFixed(1)}%</span><span>{formatCurrency(invoice.gstAmount / 2)}</span></p>
            <p><span>SGST @{Number(invoice.gstPercent / 2).toFixed(1)}%</span><span>{formatCurrency(invoice.gstAmount / 2)}</span></p>
            <p className="inv-total-line"><span>Total Amount</span><span>{formatCurrency(invoice.total)}</span></p>
            <p><span>Received Amount</span><span>{formatCurrency(0)}</span></p>
            <p className="inv-words"><strong>Total Amount (in words)</strong><br />{numberToWordsIndian(invoice.total)}</p>
          </div>
        </div>

        <div className="inv-sign-row">
          <div />
          <div>
            {settings.pdfSignatureDataUrl && (
              <img src={settings.pdfSignatureDataUrl} alt="Signature" className="inv-signature-img" style={{ marginLeft: "auto", display: "block" }} />
            )}
            <p><strong>{settings.authorisedTitle}</strong></p>
            <p>{settings.authorisedName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
