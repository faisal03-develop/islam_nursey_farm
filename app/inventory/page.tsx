import prisma from "@/lib/prisma";
import Sidebar from "@/app/Sidebar";
import InventoryClient from "./InventoryClient";
import { ItemCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const where: any = {};
  if (category && category !== "ALL") where.category = category as ItemCategory;
  if (q) where.name = { contains: q, mode: "insensitive" };

  const [items, counts] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        type: true,
        unit: true,
        costPrice: true,
        sellingPrice: true,
        quantity: true,
        lowStockAt: true,
      },
    }),
    prisma.inventoryItem.groupBy({
      by: ["category"],
      _count: { id: true },
    }),
  ]);

  const categoryMap = Object.fromEntries(
    counts.map((c) => [c.category, c._count.id])
  );

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">🌿 Inventory</div>
        </div>
        <div className="page-content fade-in">
          <InventoryClient
            items={items}
            categoryMap={categoryMap}
            activeCategory={category || "ALL"}
            q={q || ""}
          />

        </div>
      </div>
    </div>
  );
}
