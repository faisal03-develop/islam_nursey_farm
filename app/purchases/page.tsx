import prisma from "@/lib/prisma";
import Sidebar from "@/app/Sidebar";
import PurchasesClient from "./PurchasesClient";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const [purchases, items, suppliers] = await Promise.all([
    prisma.purchase.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { supplier: true, items: { include: { item: true } } },
    }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">📦 Purchases</div>
        </div>
        <div className="page-content fade-in">
          <PurchasesClient
            purchases={purchases.map((p) => ({
              ...p,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
              receivedAt: p.receivedAt?.toISOString() ?? null,
              supplier: {
                ...p.supplier,
                createdAt: p.supplier.createdAt.toISOString(),
                updatedAt: p.supplier.updatedAt.toISOString(),
              },
              items: p.items.map((pi) => ({
                ...pi,
                item: {
                  ...pi.item,
                  createdAt: pi.item.createdAt.toISOString(),
                  updatedAt: pi.item.updatedAt.toISOString(),
                },
              })),
            }))}
            inventoryItems={items.map((i) => ({
              ...i,
              createdAt: i.createdAt.toISOString(),
              updatedAt: i.updatedAt.toISOString(),
            }))}
            suppliers={suppliers.map((s) => ({
              ...s,
              createdAt: s.createdAt.toISOString(),
              updatedAt: s.updatedAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
