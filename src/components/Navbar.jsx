import { FaBell, FaCog, FaQuestionCircle, FaSearch, FaUserCircle } from "react-icons/fa";

export default function Navbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <label className="app-search">
        <FaSearch />
        <input placeholder="Search sales, clients, or invoices..." />
      </label>
      <div className="topbar-actions">
        <button type="button" title="Notifications"><FaBell /></button>
        <button type="button" title="Settings"><FaCog /></button>
        <button type="button" title="Help"><FaQuestionCircle /></button>
        <button type="button" className="topbar-user" title={user?.businessName || "Profile"} onClick={onLogout}>
          <FaUserCircle />
        </button>
      </div>
    </header>
  );
}
