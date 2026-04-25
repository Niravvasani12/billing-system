import { formatCurrency } from "../utils/formatCurrency";

export default function LeatherReportPdfDocument({
  rows = [],
  totalAmount = 0,
  totalMeters = 0,
  fromDate = "",
  toDate = "",
  elementId = "leather-report-pdf",
  containerClass = "pdf-only-report"
}) {
  const generatedAt = new Date().toLocaleString("en-GB");

  return (
    <div className={containerClass}>
      <div id={elementId} className="invoice-sheet leather-report-sheet">
        <div className="inv-top-strip">
          <span>LEATHER REPORT</span>
          <span className="inv-tag">ALL CUSTOMERS</span>
        </div>

        <div className="inv-meta-row">
          <p><strong>From:</strong> {fromDate || "-"}</p>
          <p><strong>To:</strong> {toDate || "-"}</p>
          <p><strong>Generated:</strong> {generatedAt}</p>
        </div>

        <table className="inv-items-table leather-table">
          <thead>
            <tr>
              <th>SR</th>
              <th>DATE</th>
              <th>INVOICE NO</th>
              <th>CUSTOMER</th>
              <th>ITEM</th>
              <th>QTY (MTR)</th>
              <th>RATE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.invoiceId}-${row.itemId}-${index}`}>
                <td>{index + 1}</td>
                <td>{row.date}</td>
                <td>{row.invoiceNo}</td>
                <td>{row.customerName}</td>
                <td>{row.itemName}</td>
                <td>{Number(row.meters || 0).toFixed(3)}</td>
                <td>{formatCurrency(row.pricePerMeter || 0)}</td>
                <td>{formatCurrency(row.lineTotal || 0)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8}>No records found for selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="inv-subtotal-row leather-totals">
          <strong>TOTAL</strong>
          <strong>{Number(totalMeters || 0).toFixed(3)} MTR</strong>
          <strong>{rows.length} ROWS</strong>
          <strong>{formatCurrency(totalAmount || 0)}</strong>
        </div>
      </div>
    </div>
  );
}
