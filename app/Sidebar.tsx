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

import { useState, useEffect } from "react";
import { getLowStockCount } from "@/app/actions";

export default function Sidebar() {
  const pathname = usePathname();
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    async function checkStock() {
      const count = await getLowStockCount();
      setLowStock(count);
    }
    checkStock();
    // Re-check every 2 minutes
    const timer = setInterval(checkStock, 120000);
    return () => clearInterval(timer);
  }, []);

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
            {section.items.map((item) => {
              const isInventory = item.href === "/inventory";
              const isLowStock = isInventory && lowStock > 0;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? "active" : ""} ${isLowStock ? "blink" : ""}`}
                >
                  <span className="nav-icon" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {item.icon}
                    {isLowStock && (
                      <span style={{ 
                        background: "var(--danger)", 
                        color: "white", 
                        borderRadius: "50%", 
                        width: "14px", 
                        height: "14px", 
                        fontSize: "9px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontWeight: 900
                      }}>
                        {lowStock} 
                      </span>
                    )}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        © 2026 Islam Nursery Farm
      </div>
    </aside>
  );
}
