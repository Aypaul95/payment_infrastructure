
import { prisma } from "../lib/prisma";
import type { CreateProductInput } from "../validators/product.validator";

function serializeProduct<T extends { price: bigint }>(product: T) {
  return {
    ...product,
    price: product.price.toString(),
  };
}

export async function createProduct(
  businessAccountId: string,
  input: CreateProductInput,
) {
  const product = await prisma.product.create({
    data: {
      businessAccountId,
      name: input.name,
      description: input.description,
      sku: input.sku,
      price: BigInt(input.price),
      currency: input.currency ?? "NGN",
    },
    select: {
      id: true,
      businessAccountId: true,
      name: true,
      description: true,
      sku: true,
      price: true,
      currency: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return serializeProduct(product);
}

export async function listProducts(businessAccountId: string) {
  const products = await prisma.product.findMany({
    where: {
      businessAccountId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      businessAccountId: true,
      name: true,
      description: true,
      sku: true,
      price: true,
      currency: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return products.map(serializeProduct);
}

export async function getProductById(
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
      businessAccountId: true,
      name: true,
      description: true,
      sku: true,
      price: true,
      currency: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return product ? serializeProduct(product) : null;
}