import { useEffect, useState } from "react";
import api from "../services/ipcClient";

export const SETTINGS_KEY = "billing_sys_settings_v1";

export const defaultAppSettings = {
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
  pdfLogoDataUrl: "",
  businessType: "",
  pdfSignatureDataUrl: "",
  terms: "Goods once sold will not be taken back or exchanged.\nAll disputes are subject to local jurisdiction only.",
  friendReferralCode: ""
};

const normalizeSettings = (raw) => ({
  ...defaultAppSettings,
  ...(raw || {}),
  dueDays: Number(raw?.dueDays || defaultAppSettings.dueDays)
});

const getSessionUserId = () => {
  try {
    const session = JSON.parse(localStorage.getItem("billing:auth-session") || "null");
    return session?.userId || "";
  } catch {
    return "";
  }
};

const getSettingsKey = () => {
  const userId = getSessionUserId();
  return userId ? `billing_sys_settings_v1_${userId}` : SETTINGS_KEY;
};

const readSettingsFromLocalStorage = () => {
  try {
    const key = getSettingsKey();
    const raw = localStorage.getItem(key);
    if (!raw) return { ...defaultAppSettings };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...defaultAppSettings };
  }
};

const writeSettingsToLocalStorage = (nextValue) => {
  const next = normalizeSettings(nextValue);
  const key = getSettingsKey();
  localStorage.setItem(key, JSON.stringify(next));
  return next;
};

const notifySettingsUpdated = (next) => {
  window.dispatchEvent(new CustomEvent("billing-settings-updated", { detail: next }));
};

const isUsingElectronSettings = () => typeof api?.settings?.get === "function";

export const readAppSettings = async () => {
  const userId = getSessionUserId();
  if (!isUsingElectronSettings()) {
    return readSettingsFromLocalStorage();
  }

  const remoteSettings = normalizeSettings(await api.settings.get(userId));
  const key = getSettingsKey();
  const hasLocalSettings = Boolean(localStorage.getItem(key));

  if (hasLocalSettings) {
    const localSettings = readSettingsFromLocalStorage();
    const remoteIsDefault = JSON.stringify(remoteSettings) === JSON.stringify(defaultAppSettings);
    if (remoteIsDefault) {
      const migrated = normalizeSettings(await api.settings.save(localSettings, userId));
      writeSettingsToLocalStorage(migrated);
      return migrated;
    }
  }

  writeSettingsToLocalStorage(remoteSettings);
  return remoteSettings;
};

export const writeAppSettings = async (nextValue) => {
  const userId = getSessionUserId();
  const normalized = normalizeSettings(nextValue);
  const saved = isUsingElectronSettings() ? normalizeSettings(await api.settings.save(normalized, userId)) : normalized;
  const persisted = writeSettingsToLocalStorage(saved);
  notifySettingsUpdated(persisted);
  return persisted;
};

export const resetAppSettings = async () => {
  const userId = getSessionUserId();
  const resetValue = isUsingElectronSettings()
    ? normalizeSettings(await api.settings.reset(userId))
    : normalizeSettings(defaultAppSettings);
  const persisted = writeSettingsToLocalStorage(resetValue);
  notifySettingsUpdated(persisted);
  return persisted;
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState({ ...defaultAppSettings });

  useEffect(() => {
    let mounted = true;

    readAppSettings().then((value) => {
      if (mounted) {
        setSettings(normalizeSettings(value));
      }
    });

    const onUpdated = (event) => {
      if (event?.detail) {
        setSettings(normalizeSettings(event.detail));
      } else {
        setSettings(readSettingsFromLocalStorage());
      }
    };

    window.addEventListener("billing-settings-updated", onUpdated);
    window.addEventListener("storage", onUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("billing-settings-updated", onUpdated);
      window.removeEventListener("storage", onUpdated);
    };
  }, []);

  const saveSettings = async (value) => {
    const saved = await writeAppSettings(value);
    setSettings(saved);
    return saved;
  };

  return { settings, saveSettings };
};
