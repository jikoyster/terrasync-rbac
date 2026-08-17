import { LogIn, Leaf, Bell } from "lucide-react";

export default function Header({ title, subtitle, userLabel, userRole, onLogout, notificationCount = 0 }) {
  return (
    <>
      <header className="top-header">
        <div className="brand">
          <Leaf size={27} strokeWidth={2.1} />
          <span>Terra<span>Sync</span></span>
        </div>
        <button className="signout-button" onClick={onLogout}>
          <LogIn size={17} />
          Sign Out
        </button>
      </header>

      <section className="page-heading">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="heading-actions">
          <div className="notification">
            <Bell size={19} />
            {notificationCount > 0 && <span>{notificationCount}</span>}
          </div>
          <div className="user-summary">
            <strong>{userLabel}</strong>
            <small>{userRole}</small>
          </div>
        </div>
      </section>
    </>
  );
}
