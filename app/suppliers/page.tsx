import prisma from "@/lib/prisma";
import Sidebar from "@/app/Sidebar";
import SuppliersClient from "./SuppliersClient";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      createdAt: true,
      _count: { select: { purchases: true } },
    },
  });

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">🏭 Suppliers</div>
        </div>
        <div className="page-content fade-in">
          <SuppliersClient
            suppliers={suppliers.map((s) => ({
              ...s,
              createdAt: s.createdAt.toISOString(),
              purchasesCount: s._count.purchases,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
