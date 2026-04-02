export default function Loading() {
  return (
    <div className="shell">
      <div className="sidebar" style={{ background: "var(--surface)", animation: "pulse 2s infinite" }} />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">Loading Dashboard...</div>
        </div>
        <div className="page-content" style={{ padding: "24px" }}>
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="stat-card" style={{ height: "100px", background: "var(--surface-2)", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
          <div className="card" style={{ height: "300px", background: "var(--surface-2)", animation: "pulse 2s infinite" }} />
        </div>
      </div>
    </div>
  );
}
