"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInventoryItem, deleteInventoryItem } from "@/app/actions";

const CATEGORIES = ["ALL", "PLANT", "POT", "SOIL", "FERTILIZER", "ACCESSORY", "SEED", "OTHER"];
const UNITS = ["piece", "kg", "litre", "tray", "bag", "bundle", "pack"];

type Item = {
  id: string; name: string; sku: string | null; category: string;
  type: string; unit: string; costPrice: number; sellingPrice: number;
  quantity: number; lowStockAt: number; description?: string | null;
  imageUrl?: string | null;
};

export default function InventoryClient({
  items, categoryMap, activeCategory, q,
}: {
  items: Item[];
  categoryMap: Record<string, number>;
  activeCategory: string;
  q: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState(q);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleCategoryChange(cat: string) {
    const params = new URLSearchParams();
    if (cat !== "ALL") params.set("category", cat);
    if (search) params.set("q", search);
    router.push(`/inventory?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (activeCategory !== "ALL") params.set("category", activeCategory);
    if (search) params.set("q", search);
    router.push(`/inventory?${params.toString()}`);
  }

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await createInventoryItem(fd);
      if ("error" in result) setMsg({ type: "error", text: result.error as string });
      else { setMsg({ type: "success", text: result.success ? (result.success as string) : "Item added." }); setShowModal(false); form.reset(); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const result = await deleteInventoryItem(id);
    if ("error" in result && result.error) setMsg({ type: "error", text: result.error as string });
    else router.refresh();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-desc">{items.length} items · Track stock, prices, and low-stock alerts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Item</button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"} mb-4`}>
          {msg.type === "success" ? "✅" : "❌"} {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs" style={{ margin: 0 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat} {cat !== "ALL" && categoryMap[cat] ? `(${categoryMap[cat]})` : ""}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <div className="empty-title">No items found</div>
            <div className="empty-desc">Add your first inventory item to get started.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none", borderRadius: "var(--radius-lg)" }}>
            <table>
              <thead>
                <tr>
                  <th>Name / SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Cost</th>
                  <th>Selling</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLow = item.quantity <= item.lowStockAt;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        {item.sku && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.sku}</div>}
                      </td>
                      <td>
                        <span className="badge badge-muted">{item.category}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: isLow ? "var(--danger)" : "var(--text-primary)" }}>
                          {isLow && <span className="low-stock-dot" />}
                          {item.quantity} {item.unit}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Min: {item.lowStockAt}</div>
                      </td>
                      <td>Rs {item.costPrice.toLocaleString()}</td>
                      <td><strong>Rs {item.sellingPrice.toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${isLow ? "badge-rose" : "badge-green"}`}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Inventory Item</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Item Name *</label>
                    <input className="form-input" name="name" required placeholder="e.g. Rose Plant" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU (Optional)</label>
                    <input className="form-input" name="sku" placeholder="e.g. ROSE-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" name="category" required>
                      <option value="">Select category</option>
                      {CATEGORIES.filter(c => c !== "ALL").map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-select" name="unit">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost Price (Rs)</label>
                    <input className="form-input" name="costPrice" type="number" step="0.01" placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (Rs)</label>
                    <input className="form-input" name="sellingPrice" type="number" step="0.01" placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Quantity</label>
                    <input className="form-input" name="quantity" type="number" step="0.01" placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Low Stock Alert At</label>
                    <input className="form-input" name="lowStockAt" type="number" step="0.01" defaultValue="10" />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" name="description" placeholder="Optional description…" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Adding…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
