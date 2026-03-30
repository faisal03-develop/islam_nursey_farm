"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupplier, deleteSupplier } from "@/app/actions";
import { Search, Plus, X, Factory, Trash2 } from "lucide-react";

type Supplier = {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; notes: string | null; purchasesCount: number; createdAt: string;
};

export default function SuppliersClient({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search))
    );
  }, [suppliers, search]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createSupplier(fd);
      if ("error" in res) setMsg({ type: "error", text: res.error as string });
      else { setMsg({ type: "success", text: res.success }); setShowModal(false); router.refresh(); }
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    const res = await deleteSupplier(id);
    if ("error" in res && res.error) setMsg({ type: "error", text: res.error });
    else router.refresh();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-desc">{suppliers.length} suppliers on record</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Plus size={18} /> Add Supplier</button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"} mb-4`}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={18} /></button>
        </div>
      )}

      <div className="search-wrap" style={{ marginBottom: "20px" }}>
        <span className="search-icon"><Search size={18} /></span>
        <input className="search-input" style={{ width: "300px" }} placeholder="Search supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Factory size={48} color="var(--text-muted)" /></div>
            <div className="empty-title">No suppliers yet</div>
            <div className="empty-desc">Add your nursery suppliers to track purchases.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Purchases</th>
                  <th>Since</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.phone || <span className="text-muted">—</span>}</td>
                    <td>{s.email || <span className="text-muted">—</span>}</td>
                    <td>{s.address || <span className="text-muted">—</span>}</td>
                    <td>{s.purchasesCount}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {new Date(s.createdAt).toLocaleDateString("en-PK")}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.name)} title="Delete"><Trash2 size={14} /></button>
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
              <h2 className="modal-title">Add Supplier</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label className="form-label">Supplier Name *</label>
                    <input className="form-input" name="name" required placeholder="e.g. Green Valley Nursery" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" name="phone" placeholder="03XX-XXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" name="email" type="email" placeholder="Optional" />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Address / City</label>
                    <input className="form-input" name="address" placeholder="e.g. Lahore, Punjab" />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" name="notes" placeholder="Payment terms, lead time, etc." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? "Saving…" : "Add Supplier"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
