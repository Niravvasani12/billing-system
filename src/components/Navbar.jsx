export default function Navbar({ title, appVersion }) {
  return (
    <header className="topbar">
      <div>
        <p className="muted">
          Riva DTF Printing Solution Desktop Billing Soft.{" "}
        </p>
        <h1>{title}</h1>
        {appVersion ? <p className="muted app-version">v{appVersion}</p> : null}
      </div>
      <div className="badge">DTF(Direct To Film)</div>
    </header>
  );
}
