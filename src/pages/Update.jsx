export default function Update({
  appVersion,
  updateState,
  onCheckForUpdate,
  onInstallUpdate,
}) {
  const status = updateState?.status || "idle";
  const progress = Number.isFinite(updateState?.progress) ? updateState.progress : null;
  const showInstallAction = status === "downloaded";

  return (
    <section className="stack">
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
