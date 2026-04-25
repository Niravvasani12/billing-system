import { useEffect, useState } from "react";
import api from "../services/ipcClient";

export const SETTINGS_KEY = "billing_sys_settings_v1";

export const defaultAppSettings = {
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

const readSettingsFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultAppSettings };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...defaultAppSettings };
  }
};

const writeSettingsToLocalStorage = (nextValue) => {
  const next = normalizeSettings(nextValue);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
};

const notifySettingsUpdated = (next) => {
  window.dispatchEvent(new CustomEvent("billing-settings-updated", { detail: next }));
};

const isUsingElectronSettings = () => typeof api?.settings?.get === "function";

export const readAppSettings = async () => {
  if (!isUsingElectronSettings()) {
    return readSettingsFromLocalStorage();
  }

  const remoteSettings = normalizeSettings(await api.settings.get());
  const hasLocalSettings = Boolean(localStorage.getItem(SETTINGS_KEY));

  if (hasLocalSettings) {
    const localSettings = readSettingsFromLocalStorage();
    const remoteIsDefault = JSON.stringify(remoteSettings) === JSON.stringify(defaultAppSettings);
    if (remoteIsDefault) {
      const migrated = normalizeSettings(await api.settings.save(localSettings));
      writeSettingsToLocalStorage(migrated);
      return migrated;
    }
  }

  writeSettingsToLocalStorage(remoteSettings);
  return remoteSettings;
};

export const writeAppSettings = async (nextValue) => {
  const normalized = normalizeSettings(nextValue);
  const saved = isUsingElectronSettings() ? normalizeSettings(await api.settings.save(normalized)) : normalized;
  const persisted = writeSettingsToLocalStorage(saved);
  notifySettingsUpdated(persisted);
  return persisted;
};

export const resetAppSettings = async () => {
  const resetValue = isUsingElectronSettings()
    ? normalizeSettings(await api.settings.reset())
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
