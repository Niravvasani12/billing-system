export default function Navbar({
  title,
  appVersion,
  updateState,
  onCheckForUpdate,
  onInstallUpdate,
}) {
  const status = updateState?.status || "idle";
  const progress = Number.isFinite(updateState?.progress) ? updateState.progress : null;
  const showInstallAction = status === "downloaded";

  return (
    <header className="topbar">
      <div>
        <p className="muted">Desktop Billing</p>
        <h1>{title}</h1>
        {appVersion ? <p className="muted app-version">v{appVersion}</p> : null}
      </div>
      <div className="topbar-right">
        <div className="update-box">
          <p className="update-text">
            {updateState?.message || "Updates are managed automatically."}
            {status === "downloading" && progress !== null ? ` (${progress}%)` : ""}
          </p>
          <div className="update-actions">
            {showInstallAction ? (
              <button className="update-btn" onClick={onInstallUpdate}>
                Update Now
              </button>
            ) : (
              <button className="update-btn secondary" onClick={onCheckForUpdate}>
                Check Update
              </button>
            )}
          </div>
        </div>
        <div className="badge">Live Project Mode</div>
      </div>
    </header>
  );
}
