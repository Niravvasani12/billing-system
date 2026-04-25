const INCH_TO_METER = 0.0254;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const metersFromUnit = (quantity, unit) => {
  const qty = toNumber(quantity);
  return unit === "inch" ? qty * INCH_TO_METER : qty;
};

exports.normalizeItems = (items) =>
  items
    .map((item) => {
      const quantity = toNumber(item.quantity);
      const unit = item.unit === "inch" ? "inch" : "meter";
      const meters = metersFromUnit(quantity, unit);
      const pricePerMeter = toNumber(item.pricePerMeter);
      const lineTotal = Number((meters * pricePerMeter).toFixed(2));

      return {
        description: (item.description || "").trim() || "Untitled item",
        quantity,
        unit,
        meters: Number(meters.toFixed(4)),
        pricePerMeter,
        lineTotal
      };
    })
    .filter((item) => item.quantity > 0 && item.pricePerMeter >= 0);

exports.calculateInvoiceTotals = (items, gstPercent) => {
  const safeGstPercent = toNumber(gstPercent);
  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const gstAmount = Number(((subtotal * safeGstPercent) / 100).toFixed(2));
  const total = Number((subtotal + gstAmount).toFixed(2));

  return { gstPercent: safeGstPercent, subtotal, gstAmount, total };
};
