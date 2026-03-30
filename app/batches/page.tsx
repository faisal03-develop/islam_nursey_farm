import prisma from "@/lib/prisma";
import Sidebar from "@/app/Sidebar";
import BatchesClient from "./BatchesClient";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const [batches, plants] = await Promise.all([
    prisma.batch.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        batchCode: true,
        variety: true,
        size: true,
        stage: true,
        quantity: true,
        sowingDate: true,
        notes: true,
        createdAt: true,
        item: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: { category: "PLANT" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
      },
    }),
  ]);

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">🌱 Batch Tracking</div>
        </div>
        <div className="page-content fade-in">
          <BatchesClient
            batches={batches.map((b) => ({
              ...b,
              sowingDate: b.sowingDate?.toISOString() ?? null,
              createdAt: b.createdAt.toISOString(),
              item: {
                ...b.item,
              },
            }))}
            plants={plants}
          />

        </div>
      </div>
    </div>
  );
}
