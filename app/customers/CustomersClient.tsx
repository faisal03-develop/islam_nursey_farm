"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, deleteCustomer } from "@/app/actions";
import { Search, Plus, X, Users, Trash2 } from "lucide-react";

type Customer = {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; notes: string | null; totalSpent: number;
  salesCount: number; createdAt: string;
};

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCustomer(fd);
      if ("error" in res) setMsg({ type: "error", text: res.error });
      else { setMsg({ type: "success", text: res.success }); setShowModal(false); router.refresh(); }
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? Their sales history will remain.`)) return;
    const res = await deleteCustomer(id);
    if ("error" in res && res.error) setMsg({ type: "error", text: res.error });
    else router.refresh();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-desc">{customers.length} customers registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Plus size={18} /> Add Customer</button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"} mb-4`}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={18} /></button>
        </div>
      )}

      <div className="search-wrap" style={{ marginBottom: "20px" }}>
        <span className="search-icon"><Search size={18} /></span>
        <input className="search-input" style={{ width: "300px" }} placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={48} color="var(--text-muted)" /></div>
            <div className="empty-title">No customers found</div>
            <div className="empty-desc">Add your first customer to start tracking sales history.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Sales</th>
                  <th>Total Spent</th>
                  <th>Since</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.phone || <span className="text-muted">—</span>}</td>
                    <td>{c.email || <span className="text-muted">—</span>}</td>
                    <td>{c.salesCount}</td>
                    <td><strong style={{ color: "var(--accent)" }}>Rs {c.totalSpent.toLocaleString()}</strong></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {new Date(c.createdAt).toLocaleDateString("en-PK")}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)} title="Delete"><Trash2 size={14} /></button>
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
              <h2 className="modal-title">Add Customer</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" name="name" required placeholder="e.g. Muhammad Ali" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone / WhatsApp</label>
                    <input className="form-input" name="phone" placeholder="03XX-XXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" name="email" type="email" placeholder="Optional" />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Address</label>
                    <input className="form-input" name="address" placeholder="City, Area" />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" name="notes" placeholder="Preferences, credit limit, etc." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? "Saving…" : "Add Customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
