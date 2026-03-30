import prisma from "@/lib/prisma";
import Sidebar from "@/app/Sidebar";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sales: true } } },
  });

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">👥 Customers</div>
        </div>
        <div className="page-content fade-in">
          <CustomersClient
            customers={customers.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
              salesCount: c._count.sales,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
