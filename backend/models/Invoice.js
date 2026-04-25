class Invoice {
  constructor({ id, invoiceNo, customerId, gstPercent, subtotal, gstAmount, total, notes, createdAt, items }) {
    this.id = id;
    this.invoiceNo = invoiceNo;
    this.customerId = customerId;
    this.gstPercent = gstPercent;
    this.subtotal = subtotal;
    this.gstAmount = gstAmount;
    this.total = total;
    this.notes = notes;
    this.createdAt = createdAt;
    this.items = items || [];
  }
}

module.exports = Invoice;
