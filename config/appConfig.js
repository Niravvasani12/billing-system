module.exports = {
  appName: process.env.APP_NAME || "Billing System",
  defaultGstPercent: Number(process.env.DEFAULT_GST || 18),
  currency: process.env.CURRENCY || "INR"
};
