const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

exports.normalizeItems = (items) =>
  items
    .map((item) => {
      const quantity = toNumber(item.quantity);
      const pricePerMeter = toNumber(item.pricePerMeter);
      const industry = item.industry || "Textile";
      
      let meters = quantity; // Stores computed quantity/area/weight
      let lineTotal = 0;

      const width = toNumber(item.width);
      const height = toNumber(item.height);
      const makingCharges = toNumber(item.makingCharges); // Jewellery making charges or Furniture delivery charges

      switch (industry) {
        case "Jewellery":
          // Weight * Rate + Making Charges
          lineTotal = Number(((pricePerMeter * quantity) + makingCharges).toFixed(2));
          meters = quantity;
          break;
        case "Furniture":
          // Qty * Rate + Delivery Charges (stored in makingCharges)
          lineTotal = Number(((pricePerMeter * quantity) + makingCharges).toFixed(2));
          meters = quantity;
          break;
        case "DTF Printing":
        case "Tiles & Marble":
          // Area * Rate
          const unitLower = (item.unit || "").toLowerCase();
          if (unitLower === "sq. meter" || unitLower === "sq. mtr" || unitLower === "sq meter") {
            const area = (width * height * 0.00064516) * quantity;
            meters = Number(area.toFixed(4));
          } else if (unitLower === "sq. ft." || unitLower === "sq.ft" || unitLower === "sq ft") {
            const area = (width * height / 144) * quantity;
            meters = Number(area.toFixed(4));
          } else {
            // Box or other standard units
            meters = quantity;
          }
          lineTotal = Number((meters * pricePerMeter).toFixed(2));
          break;
        case "Grocery":
        case "Sweet Mart":
          // Weight/Qty * Rate (Gram divides by 1000 to match price per Kg)
          if ((item.unit || "").toLowerCase() === "gram") {
            lineTotal = Number(((quantity / 1000) * pricePerMeter).toFixed(2));
          } else {
            lineTotal = Number((quantity * pricePerMeter).toFixed(2));
          }
          meters = quantity;
          break;
        default:
          lineTotal = Number((quantity * pricePerMeter).toFixed(2));
          meters = quantity;
          break;
      }

      return {
        description: (item.description || "").trim() || "Untitled item",
        quantity,
        unit: item.unit || "Piece",
        meters,
        pricePerMeter,
        lineTotal,
        width: item.width ? width : null,
        height: item.height ? height : null,
        makingCharges: item.makingCharges ? makingCharges : null,
        serialNumber: item.serialNumber ? String(item.serialNumber).trim() : null,
        batchNo: item.batchNo ? String(item.batchNo).trim() : null,
        expiryDate: item.expiryDate ? String(item.expiryDate).trim() : null,
        mrp: item.mrp ? toNumber(item.mrp) : null,
        partNumber: item.partNumber ? String(item.partNumber).trim() : null,
        industry
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
