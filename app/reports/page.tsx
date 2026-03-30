import prisma from "@/lib/prisma";
import Sidebar from "@/app/Sidebar";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    todaySales,
    monthSales,
    allSales,
    allPurchases,
    topItems,
    stockValue,
    salesByPayment,
    recentSales,
    salesTrend,
    categorySales,
  ] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: today } } }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: monthAgo } } }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true }),
    prisma.purchase.aggregate({ _sum: { total: true } }),
    prisma.saleItem.groupBy({
      by: ["itemId"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.inventoryItem.aggregate({ _sum: { quantity: true } }),
    prisma.sale.groupBy({
      by: ["paymentMethod"],
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.saleItem.groupBy({
      by: ["itemId"],
      _sum: { total: true },
    }),
  ]);

  // Aggregate category-wise revenue in JS to avoid complex Prisma joins if possible
  const itemDetails = await prisma.inventoryItem.findMany({
    select: { id: true, name: true, category: true },
  });
  const itemMap = Object.fromEntries(itemDetails.map((i) => [i.id, i]));

  const catMap: Record<string, number> = {};
  categorySales.forEach((s) => {
    const cat = itemMap[s.itemId]?.category || "OTHER";
    catMap[cat] = (catMap[cat] || 0) + (s._sum.total || 0);
  });
  const formattedCategorySales = Object.entries(catMap).map(([category, total]) => ({ category, total }));

  // Format daily trend
  const trendMap: Record<string, number> = {};
  salesTrend.forEach((s) => {
    const date = s.createdAt.toISOString().split("T")[0];
    trendMap[date] = (trendMap[date] || 0) + s.total;
  });
  const formattedTrend = Object.entries(trendMap).map(([date, total]) => ({ date, total }));

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">📈 Reports & Analytics</div>
        </div>
        <div className="page-content fade-in">
          <ReportsClient
            stats={{
              todayRevenue: todaySales._sum.total || 0,
              todayOrders: todaySales._count,
              monthRevenue: monthSales._sum.total || 0,
              totalRevenue: allSales._sum.total || 0,
              totalOrders: allSales._count,
              totalCost: allPurchases._sum.total || 0,
              totalStockQty: stockValue._sum.quantity || 0,
            }}
            topItems={topItems.map((i) => ({
              itemId: i.itemId,
              name: itemMap[i.itemId]?.name || "Unknown",
              category: itemMap[i.itemId]?.category || "OTHER",
              totalQty: i._sum.quantity || 0,
              totalRevenue: i._sum.total || 0,
            }))}
            salesByPayment={salesByPayment.map((s) => ({
              method: s.paymentMethod,
              total: s._sum.total || 0,
              count: s._count,
            }))}
            categorySales={formattedCategorySales}
            trendData={formattedTrend}
            recentSales={recentSales.map((s) => ({
              id: s.id,
              invoiceNo: s.invoiceNo,
              total: s.total,
              saleType: s.saleType,
              paymentMethod: s.paymentMethod,
              customerName: s.customer?.name || null,
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}

