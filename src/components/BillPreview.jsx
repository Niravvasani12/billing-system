import { useState } from "react";
import { generatePdf } from "../utils/pdfGenerator";
import { formatCurrency } from "../utils/formatCurrency";
import InvoicePdfDocument from "./InvoicePdfDocument";

export default function BillPreview({ invoice, customer }) {
  const [downloading, setDownloading] = useState(false);

  if (!invoice) return null;

  const items = invoice.items || [];
  const totalMeters = items.reduce((sum, item) => sum + Number(item.meters || 0), 0);

  const onDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await generatePdf(invoice.invoiceNo, {
        elementId: "bill-pdf",
        containerSelector: ".pdf-only",
        singlePage: true
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="panel bill-preview-wrap">
      <h3>Invoice Preview</h3>
      <div className="bill-card-lite">
        <div className="bill-head">
          <strong>RIVA ENTERPRISE</strong>
          <span>Invoice #{invoice.invoiceNo}</span>
        </div>
        <div className="bill-row-lite"><span>Customer</span><span>{customer?.name || "Walk-in Customer"}</span></div>
        <div className="bill-row-lite"><span>Mobile</span><span>{customer?.phone || "-"}</span></div>
        <div className="bill-row-lite"><span>Meter</span><span>{totalMeters.toFixed(3)} MTR</span></div>
        <div className="bill-row-lite"><span>Taxable Amount</span><strong>{formatCurrency(invoice.subtotal)}</strong></div>
        <div className="bill-total-lite"><h2>{formatCurrency(invoice.total)}</h2></div>
      </div>

      <button type="button" className="invoice-btn" onClick={onDownload} disabled={downloading}>
        {downloading ? "Preparing PDF..." : "Download Invoice PDF"}
      </button>

      <InvoicePdfDocument invoice={invoice} customer={customer} elementId="bill-pdf" containerClass="pdf-only" />
    </div>
  );
}
