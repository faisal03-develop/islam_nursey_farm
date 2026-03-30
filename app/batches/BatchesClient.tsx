"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/app/actions";
import { Search, Sprout, X, Plus } from "lucide-react";

const STAGES = ["SEED", "SEEDLING", "VEGETATIVE", "MATURE", "READY_FOR_SALE"];
const STAGE_COLORS: Record<string, string> = {
  SEED: "badge-muted",
  SEEDLING: "badge-sky",
  VEGETATIVE: "badge-green",
  MATURE: "badge-amber",
  READY_FOR_SALE: "badge-green",
};

type Plant = { id: string; name: string; category: string };
type Batch = {
  id: string; batchCode: string; variety: string | null; size: string | null;
  stage: string; quantity: number; sowingDate: string | null; notes: string | null;
  createdAt: string; item: Plant;
};

export default function BatchesClient({ batches, plants }: { batches: Batch[]; plants: Plant[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stageFilter, setStageFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Pre-compute stats in a single pass for better performance
  const { stats, filtered } = useMemo(() => {
    const s: Record<string, { count: number; qty: number }> = {};
    STAGES.forEach((stage) => {
      s[stage] = { count: 0, qty: 0 };
    });

    const f = batches.filter((b) => {
      // 1. Update stats for each stage
      if (s[b.stage]) {
        s[b.stage].count += 1;
        s[b.stage].qty += b.quantity;
      }

      // 2. Perform filtering (Stage + Search)
      const matchesStage = stageFilter === "ALL" || b.stage === stageFilter;
      const matchesSearch =
        b.batchCode.toLowerCase().includes(search.toLowerCase()) ||
        b.item.name.toLowerCase().includes(search.toLowerCase());

      return matchesStage && matchesSearch;
    });

    return { stats: s, filtered: f };
  }, [batches, stageFilter, search]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createBatch(fd);
      if ("error" in res) setMsg({ type: "error", text: res.error || "An error occurred." });
      else { setMsg({ type: "success", text: res.success || "Batch created." }); setShowModal(false); router.refresh(); }
    });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Batch Tracking</h1>
          <p className="page-desc">Track plant lots by variety, size, sowing date, and growth stage</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Plus size={18} /> New Batch</button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"} mb-4`}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={18} /></button>
        </div>
      )}

      <div className="search-wrap" style={{ marginBottom: "16px" }}>
        <span className="search-icon"><Search size={18} /></span>
        <input
          className="search-input"
          style={{ width: "100%", maxWidth: "400px" }}
          placeholder="Search by code or plant name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="tabs">
        {["ALL", ...STAGES].map((s) => (
          <button key={s} className={`tab ${stageFilter === s ? "active" : ""}`} onClick={() => setStageFilter(s)}>
            {s.replace(/_/g, " ")}
            {s !== "ALL" && ` (${stats[s]?.count || 0})`}
          </button>
        ))}
      </div>

      <div className="stats-grid" style={{ marginBottom: "20px" }}>
        {STAGES.map((stage) => {
          const { count, qty } = stats[stage];
          return (
            <div key={stage} className="stat-card">
              <div className="stat-value">{count}</div>
              <div className="stat-label">{stage.replace(/_/g, " ")}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{qty} plants</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Sprout size={48} color="var(--accent)" /></div>
            <div className="empty-title">No batches found</div>
            <div className="empty-desc">Create a batch to start tracking plant lots.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Batch Code</th>
                  <th>Plant</th>
                  <th>Variety</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Sowing Date</th>
                  <th>Stage</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td><span className="text-accent" style={{ fontWeight: 700 }}>{b.batchCode}</span></td>
                    <td><strong>{b.item.name}</strong></td>
                    <td>{b.variety || <span className="text-muted">—</span>}</td>
                    <td>{b.size || <span className="text-muted">—</span>}</td>
                    <td><strong>{b.quantity}</strong></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {b.sowingDate ? new Date(b.sowingDate).toLocaleDateString("en-PK") : "—"}
                    </td>
                    <td><span className={`badge ${STAGE_COLORS[b.stage] || "badge-muted"}`}>{b.stage.replace(/_/g, " ")}</span></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Plant Batch</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Plant Item *</label>
                    <select className="form-select" name="itemId" required>
                      <option value="">Select plant…</option>
                      {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch Code *</label>
                    <input className="form-input" name="batchCode" required placeholder="e.g. ROSE-T5-MAR" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Variety</label>
                    <input className="form-input" name="variety" placeholder="e.g. Red Hybrid" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Size</label>
                    <input className="form-input" name="size" placeholder="e.g. 6-inch pot" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" name="quantity" type="number" step="1" placeholder="100" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sowing Date</label>
                    <input className="form-input" name="sowingDate" type="date" />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Growth Stage</label>
                    <select className="form-select" name="stage">
                      {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" name="notes" placeholder="Tray #, greenhouse location, observations…" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? "Creating…" : "Create Batch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
