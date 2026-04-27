export default function Navbar({
  title,
  appVersion,
}) {
  return (
    <header className="topbar">
      <div>
        <p className="muted">Desktop Billing</p>
        <h1>{title}</h1>
        {appVersion ? <p className="muted app-version">v{appVersion}</p> : null}
      </div>
      <div className="badge">Live Project Mode</div>
    </header>
  );
}
