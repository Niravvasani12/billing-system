import logo from "../assets/logo.png";
import { useAppSettings } from "../utils/appSettings";
import { formatCurrency } from "../utils/formatCurrency";
import { numberToWordsIndian } from "../utils/numberToWords";

const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
};

export default function InvoicePdfDocument({
  invoice,
  customer,
  elementId = "bill-pdf",
  containerClass = "pdf-only"
}) {
  const { settings } = useAppSettings();
  if (!invoice) return null;

  const createdDate = new Date(invoice.createdAt);
  const dueDate = addDays(createdDate, Number(settings.dueDays || 7));
  const items = invoice.items || [];
  const totalMeters = items.reduce((sum, item) => sum + Number(item.meters || 0), 0);
  const minItemRows = 8;
  const fillerRows = Math.max(0, minItemRows - items.length);

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
          <p><strong>Invoice Date:</strong> {createdDate.toLocaleDateString("en-GB")}</p>
          <p><strong>Due Date:</strong> {dueDate.toLocaleDateString("en-GB")}</p>
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
                <td>{item.description}</td>
                <td>{Number(item.meters).toFixed(3)} MTR</td>
                <td>{formatCurrency(item.pricePerMeter)}</td>
                <td>{formatCurrency((Number(item.lineTotal) * Number(invoice.gstPercent || 0)) / 100)} ({invoice.gstPercent}%)</td>
                <td>{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td>DTF PRINTING</td>
                <td>{totalMeters.toFixed(3)} MTR</td>
                <td>{formatCurrency(0)}</td>
                <td>{formatCurrency(0)}</td>
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
          <strong>SUBTOTAL</strong>
          <strong>{totalMeters.toFixed(3)}</strong>
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
            <p>1. {settings.terms1}</p>
            <p>2. {settings.terms2}</p>
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
            <p><strong>{settings.authorisedTitle}</strong></p>
            <p>{settings.authorisedName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
