import { useEffect, useState } from "react";
import {
  defaultAppSettings,
  resetAppSettings,
  useAppSettings
} from "../utils/appSettings";

export default function Settings({
  appVersion,
  updateState,
  onCheckForUpdate,
  onInstallUpdate,
}) {
  const { settings, saveSettings } = useAppSettings();
  const [form, setForm] = useState(settings);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    await saveSettings(form);
    setSavedMsg("Settings saved. PDF will now use updated details.");
    setTimeout(() => setSavedMsg(""), 1800);
  };

  const onReset = async () => {
    const next = await resetAppSettings();
    setForm(next);
    setSavedMsg("Settings reset to default values.");
    setTimeout(() => setSavedMsg(""), 1800);
  };

  const onLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setField("pdfLogoDataUrl", reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const status = updateState?.status || "idle";
  const progress = Number.isFinite(updateState?.progress) ? updateState.progress : null;
  const showInstallAction = status === "downloaded";

  return (
    <section className="stack">
      <form className="panel stack" onSubmit={onSave}>
        <h3>Settings - Admin & PDF</h3>
        <p className="muted">Change company/admin details. Saved details automatically appear in PDF.</p>

        <div className="settings-grid">
          <input value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} placeholder="Company Name" />
          <input value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} placeholder="Mobile" />
          <input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="Email" />
          <input value={form.gstin} onChange={(e) => setField("gstin", e.target.value)} placeholder="GSTIN" />
          <input value={form.placeOfSupply} onChange={(e) => setField("placeOfSupply", e.target.value)} placeholder="Place of Supply" />
          <input type="number" min="1" value={form.dueDays} onChange={(e) => setField("dueDays", e.target.value)} placeholder="Due Days" />
        </div>

        <textarea value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Address" rows={2} />

        <div className="settings-grid">
          <input value={form.accountName} onChange={(e) => setField("accountName", e.target.value)} placeholder="Bank Account Name" />
          <input value={form.accountNo} onChange={(e) => setField("accountNo", e.target.value)} placeholder="Account Number" />
          <input value={form.ifsc} onChange={(e) => setField("ifsc", e.target.value)} placeholder="IFSC" />
          <input value={form.bankName} onChange={(e) => setField("bankName", e.target.value)} placeholder="Bank Name" />
        </div>

        <div className="settings-grid">
          <input value={form.authorisedTitle} onChange={(e) => setField("authorisedTitle", e.target.value)} placeholder="Authorised Title" />
          <input value={form.authorisedName} onChange={(e) => setField("authorisedName", e.target.value)} placeholder="Authorised Name" />
          <input value={form.pdfBadge} onChange={(e) => setField("pdfBadge", e.target.value)} placeholder="PDF Badge Text" />
        </div>

        <textarea value={form.terms1} onChange={(e) => setField("terms1", e.target.value)} placeholder="Terms Line 1" rows={2} />
        <textarea value={form.terms2} onChange={(e) => setField("terms2", e.target.value)} placeholder="Terms Line 2" rows={2} />

        <div className="panel settings-upload">
          <strong>PDF Logo / Symbol</strong>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogoChange} />
          <p className="muted">Upload new logo. It will be used in invoice PDF.</p>
          <img
            src={form.pdfLogoDataUrl || defaultAppSettings.pdfLogoDataUrl || "/app-icon.png"}
            alt="Logo Preview"
            className="settings-logo-preview"
          />
          {form.pdfLogoDataUrl && (
            <button type="button" className="danger" onClick={() => setField("pdfLogoDataUrl", "")}>Use Default Logo</button>
          )}
        </div>

        <div className="settings-actions">
          <button type="submit">Save Settings</button>
          <button type="button" className="danger" onClick={onReset}>Reset Default</button>
        </div>

        {savedMsg && <p className="muted">{savedMsg}</p>}
      </form>

      <div className="panel settings-update-panel">
        <h3>App Update</h3>
        <p className="muted">Current version: {appVersion ? `v${appVersion}` : "Unknown"}</p>
        <p className="update-text settings-update-text">
          {updateState?.message || "Updates are managed automatically."}
          {status === "downloading" && progress !== null ? ` (${progress}%)` : ""}
        </p>
        <div className="settings-update-actions">
          {showInstallAction ? (
            <button className="update-btn" type="button" onClick={onInstallUpdate}>
              Update Now
            </button>
          ) : (
            <button className="update-btn secondary" type="button" onClick={onCheckForUpdate}>
              Check Update
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
