import { PrismaClient, ItemCategory, GrowthStage, ItemType, SaleType, PaymentMethod } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Setup connection with the expected adapter for Neon/PG in Prisma 7
const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }))
});

async function main() {
  console.log('🌱 Starting seed...');

  console.log('🧹 Cleaning existing data...');
  try {
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
  } catch (e: any) {
    console.warn('⚠️ Clear failed, proceeding anyway:', e?.message || e);
  }

  // 2. Seed Suppliers
  console.log('🏭 Seeding suppliers...');
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Green Valley Wholesale',
      phone: '0300-1234567',
      email: 'sales@greenvalley.com',
      address: 'Pattoki, Punjab',
      notes: 'Leading supplier of roses and fruit saplings.',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Evergreen Plastics & Pots',
      phone: '0321-7654321',
      email: 'info@evergreenpots.pk',
      address: 'Industrial Area, Lahore',
      notes: 'Terracotta and plastic pots supplier.',
    },
  });

  // 3. Seed Customers
  console.log('👥 Seeding customers...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Ahmed Ali',
      phone: '0333-5556667',
      email: 'ahmed.ali@example.com',
      address: 'DHA Phase 5, Lahore',
      totalSpent: 45000,
    },
  });

  // 4. Seed Inventory Items
  console.log('🌿 Seeding inventory items...');
  const items = [
    {
      name: 'Red Hybrid Rose',
      sku: 'ROSE-RD-01',
      category: ItemCategory.PLANT,
      type: ItemType.STOCK_ITEM,
      unit: 'piece',
      costPrice: 80,
      sellingPrice: 150,
      quantity: 500,
      lowStockAt: 50,
      description: 'Classic red hybrid tea rose. Very fragrant.',
    },
    {
      name: 'Areca Palm (Medium)',
      sku: 'PALM-AR-MD',
      category: ItemCategory.PLANT,
      type: ItemType.STOCK_ITEM,
      unit: 'piece',
      costPrice: 450,
      sellingPrice: 850,
      quantity: 120,
      lowStockAt: 20,
      description: 'Air-purifying indoor plant, 3-4 feet tall.',
    },
    {
      name: 'Terracotta Pot 12"',
      sku: 'POT-TR-12',
      category: ItemCategory.POT,
      type: ItemType.STOCK_ITEM,
      unit: 'piece',
      costPrice: 120,
      sellingPrice: 250,
      quantity: 300,
      lowStockAt: 30,
    },
    {
      name: 'Organic Compost (5kg)',
      sku: 'SOIL-COMP-5',
      category: ItemCategory.SOIL,
      type: ItemType.STOCK_ITEM,
      unit: 'bag',
      costPrice: 180,
      sellingPrice: 350,
      quantity: 85,
    },
  ];

  const createdItems = [];
  for (const item of items) {
    const created = await prisma.inventoryItem.create({ data: item });
    createdItems.push(created);
  }

  // 5. Seed Batches
  console.log('🌱 Seeding batches...');
  const roseItem = createdItems.find(i => i.sku === 'ROSE-RD-01');
  if (roseItem) {
    await prisma.batch.create({
      data: {
        batchCode: 'ROSE-SPRING-24',
        variety: 'Red Hybrid',
        size: '6-inch pot',
        sowingDate: new Date('2024-02-15'),
        stage: GrowthStage.VEGETATIVE,
        quantity: 200,
        itemId: roseItem.id,
      },
    });
  }

  // 6. Seed Sale
  console.log('🧾 Seeding sales...');
  const palmItem = createdItems.find(i => i.sku === 'PALM-AR-MD');
  if (palmItem && customer1) {
    await prisma.sale.create({
      data: {
        invoiceNo: `INV-${Date.now()}-1`,
        saleType: SaleType.RETAIL,
        subtotal: 1700,
        discount: 100,
        total: 1600,
        amountPaid: 1600,
        paymentMethod: PaymentMethod.CASH,
        customerId: customer1.id,
        items: {
          create: [
            {
              itemId: palmItem.id,
              quantity: 2,
              unitPrice: 850,
              total: 1700,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
