"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Leaf, 
  Sprout, 
  Banknote, 
  Package, 
  Users, 
  Truck, 
  BarChart3 
} from "lucide-react";

const navItems = [
  {
    section: "Overview",
    items: [
      { href: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/inventory", icon: <Leaf size={18} />, label: "Inventory" },
      { href: "/batches",   icon: <Sprout size={18} />, label: "Batch Tracking" },
      { href: "/sales",     icon: <Banknote size={18} />, label: "Sales & POS" },
      { href: "/purchases", icon: <Package size={18} />, label: "Purchases" },
    ],
  },
  {
    section: "People",
    items: [
      { href: "/customers", icon: <Users size={18} />, label: "Customers" },
      { href: "/suppliers", icon: <Truck size={18} />, label: "Suppliers" },
    ],
  },
  {
    section: "Insights",
    items: [
      { href: "/reports", icon: <BarChart3 size={18} />, label: "Reports" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-logo">
        <div className="logo-icon">
          <Sprout size={24} color="var(--accent)" />
        </div>
        <div>
          <div className="logo-text">Islam Nursery</div>
          <div className="logo-sub">Farm Manager</div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        © 2026 Islam Nursery Farm
      </div>
    </aside>
  );
}
