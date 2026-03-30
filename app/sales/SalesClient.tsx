"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSale } from "@/app/actions";
import { 
  ReceiptText, 
  History, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2, 
  CreditCard 
} from "lucide-react";

type InventoryItem = {
  id: string; name: string; sellingPrice: number; quantity: number; unit: string; category: string;
};
type Customer = { id: string; name: string; phone: string | null };
type SaleRecord = {
  id: string; invoiceNo: string; total: number; discount: number;
  saleType: string; paymentMethod: string; status: string;
  customer: Customer | null;
  items: { id: string; quantity: number; unitPrice: number; total: number; item: InventoryItem }[];
  createdAt: string;
};

type CartItem = InventoryItem & { qty: number };

export default function SalesClient({
  sales, inventoryItems, customers,
}: {
  sales: SaleRecord[];
  inventoryItems: InventoryItem[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"pos" | "history">("pos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [saleType, setSaleType] = useState("RETAIL");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const filteredItems = inventoryItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(item: InventoryItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.id !== id));
    else setCart((prev) => prev.map((c) => c.id === id ? { ...c, qty } : c));
  }

  const subtotal = cart.reduce((s, c) => s + c.sellingPrice * c.qty, 0);
  const total = Math.max(0, subtotal - discount);

  async function handleCheckout() {
    if (cart.length === 0) { setMsg({ type: "error", text: "Cart is empty." }); return; }
    startTransition(async () => {
      const result = await createSale({
        customerId: customerId || undefined,
        saleType,
        paymentMethod,
        discount,
        notes: notes || undefined,
        items: cart.map((c) => ({ itemId: c.id, quantity: c.qty, unitPrice: c.sellingPrice })),
      });
      if ("error" in result && result.error) { setMsg({ type: "error", text: result.error }); return; }
      if (result.success && result.invoiceNo) {
        setMsg({ type: "success", text: `Sale complete! Invoice: ${result.invoiceNo} — Total: Rs ${total.toLocaleString()}` });
        setCart([]);
        setDiscount(0);
        setNotes("");
        setCustomerId("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales & POS</h1>
          <p className="page-desc">Create invoices, record payments, manage walk-in and wholesale orders</p>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"} mb-4`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {msg.type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />} {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={18} /></button>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === "pos" ? "active" : ""}`} onClick={() => setTab("pos")} style={{ display: "flex", alignItems: "center", gap: "8px" }}><ReceiptText size={18} /> POS / New Sale</button>
        <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")} style={{ display: "flex", alignItems: "center", gap: "8px" }}><History size={18} /> Sales History</button>
      </div>

      {tab === "pos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" }}>
          {/* Item Picker */}
          <div>
            <div className="card" style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <div className="search-wrap">
                  <span className="search-icon"><Search size={18} /></span>
                  <input className="search-input" style={{ width: "100%" }} placeholder="Search items to add to cart…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                {filteredItems.map((item) => (
                  <button key={item.id} onClick={() => addToCart(item)} className="btn btn-outline" style={{ flexDirection: "column", height: "80px", gap: "4px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{item.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.quantity} {item.unit} left</div>
                    <div style={{ color: "var(--accent)", fontSize: "0.85rem" }}>Rs {item.sellingPrice.toLocaleString()}</div>
                  </button>
                ))}
                {filteredItems.length === 0 && <div className="text-muted" style={{ gridColumn: "1/-1", padding: "20px", textAlign: "center" }}>No items found</div>}
              </div>
            </div>
          </div>

          {/* Cart & Checkout */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><ShoppingCart size={18} color="var(--accent)" /> Cart</div>
                {cart.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>Clear</button>
                )}
              </div>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Click items to add them to the cart
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {cart.map((c) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "var(--surface-2)", borderRadius: "8px" }}>
                      <div style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600 }}>{c.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px" }} onClick={() => updateQty(c.id, c.qty - 1)}><Minus size={14} /></button>
                        <span style={{ minWidth: "28px", textAlign: "center", fontWeight: 700 }}>{c.qty}</span>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px" }} onClick={() => updateQty(c.id, c.qty + 1)}><Plus size={14} /></button>
                      </div>
                      <div style={{ minWidth: "70px", textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>
                        Rs {(c.sellingPrice * c.qty).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: "16px" }}>Payment Details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Customer (optional)</label>
                  <select className="form-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                    <option value="">Walk-in Customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Sale Type</label>
                    <select className="form-select" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                      <option value="RETAIL">Retail</option>
                      <option value="WHOLESALE">Wholesale</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment</label>
                    <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI / Easypaisa</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount (Rs)</label>
                  <input className="form-input" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" style={{ minHeight: "56px" }} />
                </div>

                <div className="divider" />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--warning)" }}>
                    <span>Discount</span><span>- Rs {discount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>
                  <span>Total</span><span>Rs {total.toLocaleString()}</span>
                </div>

                <button className="btn btn-primary" style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={handleCheckout} disabled={isPending || cart.length === 0}>
                  {isPending ? "Processing…" : <><CreditCard size={18} /> Complete Sale · Rs {total.toLocaleString()}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card" style={{ padding: 0 }}>
          {sales.length === 0 ? (
            <div className="empty-state">
                <div className="empty-icon"><ReceiptText size={48} color="var(--text-muted)" /></div>
              <div className="empty-title">No sales yet</div>
              <div className="empty-desc">Complete your first sale from the POS screen.</div>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Type</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td><span className="text-accent">{sale.invoiceNo}</span></td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {new Date(sale.createdAt).toLocaleString("en-PK")}
                      </td>
                      <td>{sale.customer?.name || <span className="text-muted">Walk-in</span>}</td>
                      <td>{sale.items.length}</td>
                      <td><span className="badge badge-sky">{sale.saleType}</span></td>
                      <td><span className="badge badge-muted">{sale.paymentMethod}</span></td>
                      <td><strong>Rs {sale.total.toLocaleString()}</strong></td>
                      <td><span className="badge badge-green">{sale.status}</span></td>
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
