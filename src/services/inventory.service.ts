
import { prisma } from "../lib/prisma";
import type { StockMovementInput } from "../validators/inventory.validator";
import { InventoryMovementType } from "../generated/prisma/client";

export async function getInventory(
  businessAccountId: string,
  productId: string,
) {
  return prisma.inventory.findFirst({
    where: {
      productId,
      product: {
        businessAccountId,
      },
    },
    select: {
      id: true,
      productId: true,
      quantity: true,
      updatedAt: true,
    },
  });
}

export async function listInventory(businessAccountId: string) {
  return prisma.inventory.findMany({
    where: {
      product: {
        businessAccountId,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      productId: true,
      quantity: true,
      updatedAt: true,
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
  });
}

export async function stockIn(
  businessAccountId: string,
  productId: string,
  input: StockMovementInput,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: {
        id: productId,
        businessAccountId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return null;
    }

    const inventory = await tx.inventory.upsert({
      where: {
        productId,
      },
      create: {
        productId,
        quantity: input.quantity,
      },
      update: {
        quantity: {
          increment: input.quantity,
        },
      },
      select: {
        id: true,
        productId: true,
        quantity: true,
        updatedAt: true,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        productId,
        type: InventoryMovementType.STOCK_IN,
        quantity: input.quantity,
        reason: input.reason,
      },
    });

    return inventory;
  });
}

export async function stockOut(
  businessAccountId: string,
  productId: string,
  input: StockMovementInput,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: {
        id: productId,
        businessAccountId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return null;
    }

    const inventory = await tx.inventory.updateMany({
      where: {
        productId,
        quantity: {
          gte: input.quantity,
        },
      },
      data: {
        quantity: {
          decrement: input.quantity,
        },
      },
    });

    if (inventory.count === 0) {
      return {
        insufficientStock: true as const,
      };
    }

    const updatedInventory = await tx.inventory.findUnique({
      where: {
        productId,
      },
      select: {
        id: true,
        productId: true,
        quantity: true,
        updatedAt: true,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        productId,
        type: InventoryMovementType.STOCK_OUT,
        quantity: input.quantity,
        reason: input.reason,
      },
    });

    return updatedInventory;
  });
}

export async function getInventoryMovements(
  businessAccountId: string,
  productId: string,
) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      businessAccountId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    return null;
  }

  return prisma.inventoryMovement.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      productId: true,
      type: true,
      quantity: true,
      reason: true,
      createdAt: true,
    },
  });
}