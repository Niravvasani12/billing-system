const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const SETTINGS_FILE = "app-settings.json";

const defaultAppSettings = {
  companyName: "",
  address: "",
  mobile: "",
  email: "",
  gstin: "",
  placeOfSupply: "",
  bankName: "",
  accountName: "",
  accountNo: "",
  ifsc: "",
  terms1: "Goods once sold will not be taken back or exchanged.",
  terms2: "All disputes are subject to local jurisdiction only.",
  authorisedTitle: "AUTHORISED SIGNATORY FOR",
  authorisedName: "",
  pdfBadge: "ORIGINAL FOR RECIPIENT",
  dueDays: 7,
  pdfLogoDataUrl: ""
};

const normalizeSettings = (raw) => ({
  ...defaultAppSettings,
  ...(raw || {}),
  dueDays: Number(raw?.dueDays || defaultAppSettings.dueDays)
});

const resolveSettingsPath = (userId) => {
  const persistentDir = app?.getPath?.("appData")
    ? path.join(app.getPath("appData"), "BillingSystemData")
    : path.join(__dirname, "..", "..", "database");

  if (!fs.existsSync(persistentDir)) {
    fs.mkdirSync(persistentDir, { recursive: true });
  }

  const fileName = userId ? `app-settings-${userId}.json` : SETTINGS_FILE;
  return path.join(persistentDir, fileName);
};

const readSettingsFile = (userId) => {
  try {
    const filePath = resolveSettingsPath(userId);
    if (!fs.existsSync(filePath)) return { ...defaultAppSettings };
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw?.trim()) return { ...defaultAppSettings };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...defaultAppSettings };
  }
};

const writeSettingsFile = (settings, userId) => {
  const filePath = resolveSettingsPath(userId);
  const normalized = normalizeSettings(settings);
  fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
};

exports.getSettings = (userId) => readSettingsFile(userId);
exports.saveSettings = (settings, userId) => writeSettingsFile(settings, userId);
exports.resetSettings = (userId) => writeSettingsFile(defaultAppSettings, userId);
