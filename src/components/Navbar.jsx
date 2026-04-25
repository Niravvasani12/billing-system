export default function Navbar({ title }) {
  return (
    <header className="topbar">
      <div>
        <p className="muted">Desktop Billing</p>
        <h1>{title}</h1>
      </div>
      <div className="badge">Live Project Mode</div>
    </header>
  );
}
