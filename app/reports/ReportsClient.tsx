import { 
  Banknote, 
  Package, 
  TrendingUp, 
  Sun, 
  Trophy, 
  CreditCard 
} from "lucide-react";

type Stats = {
  todayRevenue: number; todayOrders: number;
  monthRevenue: number; totalRevenue: number;
  totalOrders: number; totalCost: number;
  totalStockQty: number;
};

type TopItem = {
  itemId: string; name: string; category: string;
  totalQty: number; totalRevenue: number;
};

type PaymentStat = { method: string; total: number; count: number };
type CategoryStat = { category: string; total: number };
type TrendPoint = { date: string; total: number };

type RecentSale = {
  id: string; invoiceNo: string; total: number;
  saleType: string; paymentMethod: string;
  customerName: string | null; createdAt: string;
};

// ─── Visual Components ───────────────────────────────────────

function TrendLine({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return <div className="text-muted" style={{ padding: "20px", textAlign: "center" }}>Insufficient data for trend</div>;

  const max = Math.max(...data.map(d => d.total)) || 1;
  const padding = 20;
  const width = 500;
  const height = 150;
  const spacing = (width - padding * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = padding + i * spacing;
    const y = height - padding - (d.total / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill */}
        <polyline
          fill="url(#gradient)"
          stroke="none"
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        />
        {/* Line */}
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Points */}
        {data.map((d, i) => {
          const x = padding + i * spacing;
          const y = height - padding - (d.total / max) * (height - padding * 2);
          return <circle key={i} cx={x} cy={y} r="4" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}

function PieChart({ data }: { data: CategoryStat[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return <div className="empty-state">No category data</div>;

  const colors = ["#4ade80", "#38bdf8", "#fbbf24", "#fb7185", "#a78bfa", "#94a3b8"];
  let accumulatedPercent = 0;

  const segments = data.map((d, i) => {
    const start = accumulatedPercent;
    const percent = (d.total / total) * 100;
    accumulatedPercent += percent;
    return `${colors[i % colors.length]} ${start}% ${accumulatedPercent}%`;
  }).join(", ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
      <div
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          background: `conic-gradient(${segments})`,
          boxShadow: "0 0 20px rgba(0,0,0,0.2), inset 0 0 0 20px var(--surface)",
          flexShrink: 0
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {data.map((d, i) => (
          <div key={d.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length] }} />
              <span style={{ color: "var(--text-secondary)" }}>{d.category}</span>
            </div>
            <span style={{ fontWeight: 600 }}>{((d.total / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsClient({
  stats, topItems, salesByPayment, categorySales, trendData, recentSales,
}: {
  stats: Stats;
  topItems: TopItem[];
  salesByPayment: PaymentStat[];
  categorySales: CategoryStat[];
  trendData: TrendPoint[];
  recentSales: RecentSale[];
}) {
  const profit = stats.totalRevenue - stats.totalCost;
  const margin = stats.totalRevenue > 0 ? (profit / stats.totalRevenue) * 100 : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-desc">Financial insights and performance metrics for your nursery</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon green"><Banknote size={20} /></div>
          <div className="stat-value">Rs {stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>Lifetime sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rose"><Package size={20} /></div>
          <div className="stat-value">Rs {stats.totalCost.toLocaleString()}</div>
          <div className="stat-label">Total Cost</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>Purchase value</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sky"><TrendingUp size={20} /></div>
          <div className="stat-value" style={{ color: profit >= 0 ? "var(--accent)" : "var(--danger)" }}>
            Rs {profit.toLocaleString()}
          </div>
          <div className="stat-label">Net Profit</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>{margin.toFixed(1)}% margin</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Sun size={20} /></div>
          <div className="stat-value">Rs {stats.todayRevenue.toLocaleString()}</div>
          <div className="stat-label">Today's Revenue</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>{stats.todayOrders} orders</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: "24px", gridTemplateColumns: "2fr 1fr" }}>
        {/* Trendline */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Trend</div>
              <div className="card-subtitle">Daily sales for the last 30 days</div>
            </div>
          </div>
          <TrendLine data={trendData} />
        </div>

        {/* Category Pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Category Share</div>
              <div className="card-subtitle">Revenue distribution</div>
            </div>
          </div>
          <PieChart data={categorySales} />
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: "24px" }}>
        {/* Top Selling Items */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><Trophy size={18} color="var(--accent)" /> Top Sellers</div>
              <div className="card-subtitle">High performing items</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {topItems.map((item, idx) => (
              <div key={item.itemId}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 800, color: "var(--text-muted)", fontSize: "0.7rem", width: "16px" }}>{idx + 1}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.name}</div>
                      <div className="badge badge-muted" style={{ fontSize: "0.6rem", padding: "1px 6px" }}>{item.category}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.875rem" }}>Rs {item.totalRevenue.toLocaleString()}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.totalQty} units</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><CreditCard size={18} color="var(--accent)" /> Payments</div>
              <div className="card-subtitle">By payment method</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {salesByPayment.map((p) => (
              <div key={p.method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.method}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>Rs {p.total.toLocaleString()}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.count} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "20px 24px 12px" }}>
          <div className="card-title">Recent Transactions</div>
        </div>
        <div className="table-wrap" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id}>
                  <td><span className="text-accent" style={{ fontWeight: 600 }}>{s.invoiceNo}</span></td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(s.createdAt).toLocaleDateString("en-PK")}</td>
                  <td>{s.customerName || <span className="text-muted">Walk-in</span>}</td>
                  <td><span className="badge badge-muted">{s.paymentMethod}</span></td>
                  <td><strong style={{ color: "var(--accent)" }}>Rs {s.total.toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

