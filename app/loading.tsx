export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--accent)",
        gap: "12px",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid var(--accent-dim)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Loading System
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
