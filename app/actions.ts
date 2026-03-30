"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ItemCategory, ItemType, GrowthStage } from "@prisma/client";

// ─── Inventory ────────────────────────────────────────────────────────────────
export async function createInventoryItem(formData: FormData) {
  const name         = formData.get("name") as string;
  const sku          = formData.get("sku") as string | null;
  const category     = formData.get("category") as ItemCategory;
  const type         = (formData.get("type") as ItemType) || "STOCK_ITEM";
  const unit         = formData.get("unit") as string || "piece";
  const costPrice    = parseFloat(formData.get("costPrice") as string) || 0;
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string) || 0;
  const quantity     = parseFloat(formData.get("quantity") as string) || 0;
  const lowStockAt   = parseFloat(formData.get("lowStockAt") as string) || 10;
  const description  = formData.get("description") as string | null;
  const imageUrl     = formData.get("imageUrl") as string | null;

  if (!name || !category) return { error: "Name and category are required." };

  try {
    await prisma.inventoryItem.create({
      data: {
        name,
        sku: sku || undefined,
        category,
        type,
        unit,
        costPrice,
        sellingPrice,
        quantity,
        lowStockAt,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      },
    });
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: "Item added successfully." };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create item. SKU may already exist." };
  }
}

export async function updateInventoryQuantity(id: string, delta: number) {
  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: { increment: delta } },
    });
    revalidatePath("/inventory");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await prisma.inventoryItem.delete({ where: { id } });
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to delete." };
  }
}

// ─── Batches ──────────────────────────────────────────────────────────────────
export async function createBatch(formData: FormData) {
  const itemId     = formData.get("itemId") as string;
  const batchCode  = formData.get("batchCode") as string;
  const variety    = formData.get("variety") as string | null;
  const size       = formData.get("size") as string | null;
  const stage      = (formData.get("stage") as GrowthStage) || "SEEDLING";
  const quantity   = parseFloat(formData.get("quantity") as string) || 0;
  const sowingDate = formData.get("sowingDate") as string | null;
  const notes      = formData.get("notes") as string | null;

  if (!itemId || !batchCode) return { error: "Item and batch code are required." };

  try {
    await prisma.batch.create({
      data: {
        batchCode,
        variety: variety || undefined,
        size: size || undefined,
        stage,
        quantity,
        sowingDate: sowingDate ? new Date(sowingDate) : undefined,
        notes: notes || undefined,
        itemId,
      },
    });
    revalidatePath("/batches");
    return { success: "Batch created." };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create batch. Code may already exist." };
  }
}

// ─── Sales ────────────────────────────────────────────────────────────────────
export async function createSale(data: {
  customerId?: string;
  saleType: string;
  paymentMethod: string;
  discount: number;
  notes?: string;
  items: { itemId: string; quantity: number; unitPrice: number }[];
}) {
  const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total    = Math.max(0, subtotal - data.discount);
  const invoiceNo = `INV-${Date.now()}`;

  try {
    const sale = await prisma.sale.create({
      data: {
        invoiceNo,
        saleType:      data.saleType as "RETAIL" | "WHOLESALE",
        paymentMethod: data.paymentMethod as "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "CREDIT",
        subtotal,
        discount:      data.discount,
        total,
        amountPaid:    total,
        notes:         data.notes,
        customerId:    data.customerId || undefined,
        items: {
          create: data.items.map((i) => ({
            itemId:    i.itemId,
            quantity:  i.quantity,
            unitPrice: i.unitPrice,
            total:     i.quantity * i.unitPrice,
          })),
        },
      },
    });

    // Deduct stock
    for (const item of data.items) {
      await prisma.inventoryItem.update({
        where: { id: item.itemId },
        data:  { quantity: { decrement: item.quantity } },
      });
    }

    // Update customer total spent
    if (data.customerId) {
      await prisma.customer.update({
        where: { id: data.customerId },
        data:  { totalSpent: { increment: total } },
      });
    }

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, invoiceNo: sale.invoiceNo, saleId: sale.id };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create sale." };
  }
}

// ─── Purchases ────────────────────────────────────────────────────────────────
export async function createPurchase(data: {
  supplierId: string;
  notes?: string;
  items: { itemId: string; quantity: number; unitCost: number }[];
}) {
  const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const poNumber = `PO-${Date.now()}`;

  try {
    await prisma.purchase.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        subtotal,
        total: subtotal,
        notes: data.notes,
        receivedAt: new Date(),
        items: {
          create: data.items.map((i) => ({
            itemId:   i.itemId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            total:    i.quantity * i.unitCost,
          })),
        },
      },
    });

    // Add stock
    for (const item of data.items) {
      await prisma.inventoryItem.update({
        where: { id: item.itemId },
        data:  { quantity: { increment: item.quantity } },
      });
    }

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, poNumber };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create purchase." };
  }
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function createCustomer(formData: FormData) {
  const name    = formData.get("name") as string;
  const phone   = formData.get("phone") as string | null;
  const email   = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;
  const notes   = formData.get("notes") as string | null;

  if (!name) return { error: "Name is required." };

  try {
    await prisma.customer.create({
      data: {
        name,
        phone:   phone || undefined,
        email:   email || undefined,
        address: address || undefined,
        notes:   notes || undefined,
      },
    });
    revalidatePath("/customers");
    return { success: "Customer added." };
  } catch (e) {
    console.error(e);
    return { error: "Failed to add customer." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to delete." };
  }
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
export async function createSupplier(formData: FormData) {
  const name    = formData.get("name") as string;
  const phone   = formData.get("phone") as string | null;
  const email   = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;
  const notes   = formData.get("notes") as string | null;

  if (!name) return { error: "Name is required." };

  try {
    await prisma.supplier.create({
      data: {
        name,
        phone:   phone || undefined,
        email:   email || undefined,
        address: address || undefined,
        notes:   notes || undefined,
      },
    });
    revalidatePath("/suppliers");
    return { success: "Supplier added." };
  } catch (e) {
    console.error(e);
    return { error: "Failed to add supplier." };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/suppliers");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to delete." };
  }
}
