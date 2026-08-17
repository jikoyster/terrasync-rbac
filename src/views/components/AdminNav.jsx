import { ChartNoAxesCombined, Tractor, Store, Building2, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { label: "Overview", icon: ChartNoAxesCombined, to: "/admin/dashboard" },
  { label: "Farms", icon: Tractor, to: "/admin/dashboard#farms" },
  { label: "Vendors", icon: Store, to: "/admin/dashboard#vendors" },
  { label: "Coop", icon: Building2, to: "/admin/dashboard#coop" },
  { label: "Admin", icon: Settings, to: "/admin/dashboard#admin" }
];

export default function AdminNav() {
  return (
    <nav className="main-nav">
      {items.map(({ label, icon: Icon, to }, index) => (
        <NavLink
          key={label}
          to={to}
          className={({ isActive }) => `nav-item ${index === 0 && isActive ? "active" : ""}`}
          onClick={(event) => {
            if (index > 0) event.preventDefault();
          }}
        >
          <Icon size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
