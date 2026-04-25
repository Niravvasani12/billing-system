const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const SETTINGS_FILE = "app-settings.json";

const defaultAppSettings = {
  companyName: "RIVA ENTERPRISE",
  address: "32, Pushpa Nagar, Punagam Road, Surat, Gujarat, 395010",
  mobile: "8000572371",
  email: "rivaenterprise2208@gmail.com",
  gstin: "24FOMPP6860N2Z0",
  placeOfSupply: "Gujarat",
  bankName: "Surat District Co-operative Bank, PUNA",
  accountName: "RIVA ENTERPRISE",
  accountNo: "401003613217",
  ifsc: "SDCB0000098",
  terms1: "Goods once sold will not be taken back or exchanged.",
  terms2: "All disputes are subject to Surat jurisdiction only.",
  authorisedTitle: "AUTHORISED SIGNATORY FOR",
  authorisedName: "RIVA ENTERPRISE",
  pdfBadge: "ORIGINAL FOR RECIPIENT",
  dueDays: 7,
  pdfLogoDataUrl: ""
};

const normalizeSettings = (raw) => ({
  ...defaultAppSettings,
  ...(raw || {}),
  dueDays: Number(raw?.dueDays || defaultAppSettings.dueDays)
});

const resolveSettingsPath = () => {
  const persistentDir = app?.getPath?.("appData")
    ? path.join(app.getPath("appData"), "BillingSystemData")
    : path.join(__dirname, "..", "..", "database");

  if (!fs.existsSync(persistentDir)) {
    fs.mkdirSync(persistentDir, { recursive: true });
  }

  return path.join(persistentDir, SETTINGS_FILE);
};

const readSettingsFile = () => {
  try {
    const filePath = resolveSettingsPath();
    if (!fs.existsSync(filePath)) return { ...defaultAppSettings };
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw?.trim()) return { ...defaultAppSettings };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...defaultAppSettings };
  }
};

const writeSettingsFile = (settings) => {
  const filePath = resolveSettingsPath();
  const normalized = normalizeSettings(settings);
  fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
};

exports.getSettings = () => readSettingsFile();
exports.saveSettings = (settings) => writeSettingsFile(settings);
exports.resetSettings = () => writeSettingsFile(defaultAppSettings);
