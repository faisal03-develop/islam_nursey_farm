import prisma from "@/lib/prisma";
import Sidebar from "@/app/Sidebar";
import SalesClient from "./SalesClient";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, items, customers] = await Promise.all([
    prisma.sale.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { include: { item: true } } },
    }),
    prisma.inventoryItem.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">🧾 Sales & POS</div>
        </div>
        <div className="page-content fade-in">
          <SalesClient
            sales={sales.map((s) => ({
              ...s,
              createdAt: s.createdAt.toISOString(),
              updatedAt: s.updatedAt.toISOString(),
              customer: s.customer
                ? { ...s.customer, createdAt: s.customer.createdAt.toISOString(), updatedAt: s.customer.updatedAt.toISOString() }
                : null,
              items: s.items.map((si) => ({
                ...si,
                item: {
                  ...si.item,
                  createdAt: si.item.createdAt.toISOString(),
                  updatedAt: si.item.updatedAt.toISOString(),
                },
              })),
            }))}
            inventoryItems={items.map((i) => ({
              ...i,
              createdAt: i.createdAt.toISOString(),
              updatedAt: i.updatedAt.toISOString(),
            }))}
            customers={customers.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
