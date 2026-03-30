"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/app/actions";
import { Package, History, Plus, X, CheckCircle2 } from "lucide-react";

type InventoryItem = { id: string; name: string; unit: string; costPrice: number; category: string };
type Supplier = { id: string; name: string; phone: string | null };
type PurchaseRecord = {
  id: string; poNumber: string; total: number; status: string;
  supplier: Supplier;
  items: { id: string; quantity: number; unitCost: number; total: number; item: InventoryItem }[];
  receivedAt: string | null; createdAt: string;
};

type LineItem = { itemId: string; name: string; qty: number; unitCost: number };

export default function PurchasesClient({
  purchases, inventoryItems, suppliers,
}: {
  purchases: PurchaseRecord[];
  inventoryItems: InventoryItem[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function addLine() {
    setLines((prev) => [...prev, { itemId: "", name: "", qty: 1, unitCost: 0 }]);
  }

  function updateLine(idx: number, field: keyof LineItem, val: string | number) {
    setLines((prev) => prev.map((l, i) => {
      if (i !== idx) return l;
      if (field === "itemId") {
        const item = inventoryItems.find((inv) => inv.id === val);
        return { ...l, itemId: val as string, name: item?.name || "", unitCost: item?.costPrice || 0 };
      }
      return { ...l, [field]: val };
    }));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = lines.reduce((s, l) => s + l.qty * l.unitCost, 0);

  async function handleSubmit() {
    if (!supplierId) { setMsg({ type: "error", text: "Select a supplier." }); return; }
    if (lines.length === 0 || lines.some((l) => !l.itemId)) { setMsg({ type: "error", text: "Add at least one item." }); return; }

    startTransition(async () => {
      const res = await createPurchase({
        supplierId,
        notes: notes || undefined,
        items: lines.map((l) => ({ itemId: l.itemId, quantity: l.qty, unitCost: l.unitCost })),
      });
      if ("error" in res && res.error) { setMsg({ type: "error", text: res.error }); return; }
      if (res.success) {
        setMsg({ type: "success", text: `Purchase recorded! PO: ${res.poNumber}` });
        setSupplierId(""); setNotes(""); setLines([]);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-desc">Record incoming stock from suppliers, track POs</p>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"} mb-4`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {msg.type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />} {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={18} /></button>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === "new" ? "active" : ""}`} onClick={() => setTab("new")} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Package size={18} /> New Purchase</button>
        <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")} style={{ display: "flex", alignItems: "center", gap: "8px" }}><History size={18} /> Purchase History</button>
      </div>

      {tab === "new" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
          <div>
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-header">
                <div className="card-title">Purchase Items</div>
                <button className="btn btn-outline btn-sm" onClick={addLine} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Plus size={16} /> Add Line</button>
              </div>
              {lines.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Click &quot;Add Line&quot; to add items to this purchase order
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {lines.map((line, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px auto", gap: "8px", alignItems: "center" }}>
                      <select className="form-select" value={line.itemId} onChange={(e) => updateLine(idx, "itemId", e.target.value)}>
                        <option value="">Select item…</option>
                        {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                      </select>
                      <input className="form-input" type="number" placeholder="Qty" value={line.qty} min="1" step="0.01" onChange={(e) => updateLine(idx, "qty", parseFloat(e.target.value))} />
                      <input className="form-input" type="number" placeholder="Cost (Rs)" value={line.unitCost} min="0" step="0.01" onChange={(e) => updateLine(idx, "unitCost", parseFloat(e.target.value))} />
                      <button className="btn btn-danger btn-sm" onClick={() => removeLine(idx)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: "16px" }}>Order Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Supplier *</label>
                <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Select supplier…</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" style={{ minHeight: "56px" }} />
              </div>
              <div className="divider" />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", color: "var(--accent)" }}>
                <span>Total</span><span>Rs {total.toLocaleString()}</span>
              </div>
              <button className="btn btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Recording…" : <><Package size={18} /> Record Purchase</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card" style={{ padding: 0 }}>
          {purchases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Package size={48} color="var(--text-muted)" /></div>
              <div className="empty-title">No purchases yet</div>
              <div className="empty-desc">Record your first purchase to update stock.</div>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>PO #</th>
                    <th>Supplier</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td><span className="text-accent">{p.poNumber}</span></td>
                      <td><strong>{p.supplier.name}</strong></td>
                      <td>{p.items.length}</td>
                      <td><strong>Rs {p.total.toLocaleString()}</strong></td>
                      <td><span className="badge badge-green">{p.status}</span></td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-PK")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
