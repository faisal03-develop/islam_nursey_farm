import prisma from "@/lib/prisma";
import Sidebar from "./Sidebar";
import Link from "next/link";
import { 
  Sparkles, 
  Leaf, 
  AlertTriangle, 
  Banknote, 
  TrendingUp, 
  Users, 
  Truck, 
  ReceiptText, 
  CheckCircle2, 
  Package, 
  Sprout, 
  BarChart3 
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      totalItems,
      totalCustomers,
      totalSuppliers,
      revenueStats,
      recentSales,
      lowStock,
      todayRevenue
    ] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.sale.aggregate({ _sum: { total: true } }),
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNo: true,
          total: true,
          paymentMethod: true,
          customer: { select: { name: true } },
          items: { select: { id: true } },
        },
      }),
      prisma.$queryRaw`SELECT id, name, quantity, "lowStockAt", unit FROM "InventoryItem" WHERE quantity <= "lowStockAt" ORDER BY quantity ASC LIMIT 5`,
      prisma.sale.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: today } },
      }),
    ]);

    return {
      totalItems,
      lowStockCount: (lowStock as any[]).length,
      todayRevenue: todayRevenue._sum.total || 0,
      totalCustomers,
      totalSuppliers,
      totalRevenue: revenueStats._sum.total || 0,
      recentSales,
      lowStock: lowStock as any[],
    };
  } catch (e) {
    console.error("Dashboard error:", e);
    return {
      totalItems: 0, lowStockCount: 0, todayRevenue: 0,
      totalCustomers: 0, totalSuppliers: 0, totalRevenue: 0,
      recentSales: [], lowStock: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {greeting} <Sparkles size={20} color="var(--accent)" />
            </div>
          </div>
          <div className="topbar-right">
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {now.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <Link href="/sales" className="btn btn-primary btn-sm">+ New Sale</Link>
          </div>
        </div>

        <div className="page-content fade-in">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green"><Leaf size={20} /></div>
              <div className="stat-value">{data.totalItems}</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon rose"><AlertTriangle size={20} /></div>
              <div className="stat-value">{data.lowStockCount}</div>
              <div className="stat-label">Low Stock Alerts</div>
              {data.lowStockCount > 0 && <span className="stat-change warn">Needs attention</span>}
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><Banknote size={20} /></div>
              <div className="stat-value">Rs {data.todayRevenue.toLocaleString()}</div>
              <div className="stat-label">Today's Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon sky"><TrendingUp size={20} /></div>
              <div className="stat-value">Rs {data.totalRevenue.toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon violet"><Users size={20} /></div>
              <div className="stat-value">{data.totalCustomers}</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Truck size={20} /></div>
              <div className="stat-value">{data.totalSuppliers}</div>
              <div className="stat-label">Suppliers</div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Recent Sales */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Recent Sales</div>
                  <div className="card-subtitle">Latest transactions</div>
                </div>
                <Link href="/sales" className="btn btn-ghost btn-sm">View all →</Link>
              </div>
              {data.recentSales.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><ReceiptText size={48} color="var(--text-muted)" /></div>
                  <div className="empty-title">No sales yet</div>
                  <div className="empty-desc">Start your first sale from the POS screen.</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td><span className="text-accent">{sale.invoiceNo}</span></td>
                          <td>{sale.customer?.name || <span className="text-muted">Walk-in</span>}</td>
                          <td>{sale.items.length}</td>
                          <td><strong>Rs {sale.total.toLocaleString()}</strong></td>
                          <td>
                            <span className="badge badge-green">{sale.paymentMethod}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Low Stock Alerts</div>
                  <div className="card-subtitle">Items needing restocking</div>
                </div>
                <Link href="/inventory" className="btn btn-ghost btn-sm">Manage →</Link>
              </div>
              {data.lowStock.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><CheckCircle2 size={48} color="var(--accent)" /></div>
                  <div className="empty-title">All stocked up!</div>
                  <div className="empty-desc">No items are low on stock right now.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {data.lowStock.map((item) => {
                    const pct = Math.max(0, Math.min(100, (item.quantity / item.lowStockAt) * 100));
                    const fillClass = pct < 25 ? "danger" : pct < 50 ? "warn" : "";
                    return (
                      <div key={item.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            <span className="low-stock-dot" />
                            {item.name}
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {item.quantity} / {item.lowStockAt} {item.unit}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/sales" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ReceiptText size={16} /> New Sale
              </Link>
              <Link href="/inventory" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Leaf size={16} /> Add Item
              </Link>
              <Link href="/purchases" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Package size={16} /> New Purchase
              </Link>
              <Link href="/batches" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sprout size={16} /> New Batch
              </Link>
              <Link href="/customers" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={16} /> Add Customer
              </Link>
              <Link href="/reports" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={16} /> View Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
