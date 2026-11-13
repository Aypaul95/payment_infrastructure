
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import type { CreateOrderInput } from "../validators/order.validator";

type OrderRequestItem = {
  productId: string;
  quantity: number;
};

const MAX_TRANSACTION_ATTEMPTS = 3;

function normalizeItems(items: OrderRequestItem[]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    );
  }

  return [...quantities.entries()]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
}

function isSameOrderRequest(
  existing: {
    customerId: string;
    customerAddressId: string;
    discount: bigint;
    items: { productId: string; quantity: number }[];
  },
  input: CreateOrderInput,
) {
  const existingItems = normalizeItems(existing.items);
  const requestedItems = normalizeItems(input.items);

  return (
    existing.customerId === input.customerId &&
    existing.customerAddressId === input.customerAddressId &&
    existing.discount === BigInt(input.discount) &&
    existingItems.length === requestedItems.length &&
    existingItems.every(
      (item, index) =>
        item.productId === requestedItems[index].productId &&
        item.quantity === requestedItems[index].quantity,
    )
  );
}

function serializeOrder<
  T extends {
    subtotal: bigint;
    discount: bigint;
    total: bigint;
    items?: unknown[];
  },
>(order: T) {
  return {
    ...order,
    subtotal: order.subtotal.toString(),
    discount: order.discount.toString(),
    total: order.total.toString(),
    ...(order.items
      ? {
          items: order.items.map((item) => {
            const orderItem = item as {
              unitPrice?: bigint;
              subtotal?: bigint;
              [key: string]: unknown;
            };

            return {
              ...orderItem,
              ...(typeof orderItem.unitPrice === "bigint"
                ? { unitPrice: orderItem.unitPrice.toString() }
                : {}),
              ...(typeof orderItem.subtotal === "bigint"
                ? { subtotal: orderItem.subtotal.toString() }
                : {}),
            };
          }),
        }
      : {}),
  };
}

function getPrismaErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

async function findExistingOrder(
  businessAccountId: string,
  idempotencyKey: string,
) {
  return prisma.order.findUnique({
    where: {
      businessAccountId_idempotencyKey: {
        businessAccountId,
        idempotencyKey,
      },
    },
    include: {
      items: true,
    },
  });
}

async function getMatchingExistingOrder(
  businessAccountId: string,
  input: CreateOrderInput,
) {
  const existingOrder = await findExistingOrder(
    businessAccountId,
    input.idempotencyKey,
  );

  if (!existingOrder) {
    return null;
  }

  if (!isSameOrderRequest(existingOrder, input)) {
    throw new Error("IDEMPOTENCY_KEY_REUSED");
  }

  return serializeOrder(existingOrder);
}

export async function createOrder(
  businessAccountId: string,
  input: CreateOrderInput,
) {
  const requestedItems = normalizeItems(input.items);
  const discount = BigInt(input.discount);

  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_ATTEMPTS;
    attempt++
  ) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existingOrder = await tx.order.findUnique({
            where: {
              businessAccountId_idempotencyKey: {
                businessAccountId,
                idempotencyKey: input.idempotencyKey,
              },
            },
            include: {
              items: true,
            },
          });

          if (existingOrder) {
            if (!isSameOrderRequest(existingOrder, input)) {
              throw new Error("IDEMPOTENCY_KEY_REUSED");
            }

            return serializeOrder(existingOrder);
          }

          const customer = await tx.customer.findFirst({
            where: {
              id: input.customerId,
              businessAccountId,
            },
            select: {
              id: true,
            },
          });

          if (!customer) {
            throw new Error("CUSTOMER_NOT_FOUND");
          }
          const customerAddress = await tx.customerAddress.findFirst({
            where: {
              id: input.customerAddressId,
              customerId: customer.id,
            },
          });

          if (!customerAddress) {
            throw new Error("CUSTOMER_ADDRESS_NOT_FOUND");
          }

          const products = await tx.product.findMany({
            where: {
              id: {
                in: requestedItems.map((item) => item.productId),
              },
              businessAccountId,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              currency: true,
            },
          });

          if (products.length !== requestedItems.length) {
            throw new Error("PRODUCT_NOT_FOUND_OR_INACTIVE");
          }

          const business = await tx.businessAccount.findUnique({
            where: {
              id: businessAccountId,
            },
            select: {
              currency: true,
            },
          });

          if (!business) {
            throw new Error("BUSINESS_NOT_FOUND");
          }

          const productById = new Map(
            products.map((product) => [product.id, product]),
          );

          let subtotal = 0n;

          const orderItems = requestedItems.map((item) => {
            const product = productById.get(item.productId)!;

            if (product.currency !== business.currency) {
              throw new Error("PRODUCT_CURRENCY_MISMATCH");
            }

            const itemSubtotal =
              product.price * BigInt(item.quantity);

            subtotal += itemSubtotal;

            return {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              quantity: item.quantity,
              unitPrice: product.price,
              subtotal: itemSubtotal,
            };
          });

          if (discount > subtotal) {
            throw new Error("DISCOUNT_EXCEEDS_SUBTOTAL");
          }

          const total = subtotal - discount;

          // Reserve available stock atomically.
          for (const item of requestedItems) {
            const updatedCount = await tx.$executeRaw`
              UPDATE "Inventory"
              SET
                "reservedQuantity" = "reservedQuantity" + ${item.quantity},
                "updatedAt" = NOW()
              WHERE
                "productId" = ${item.productId}
                AND ("quantity" - "reservedQuantity") >= ${item.quantity}
            `;

            if (updatedCount !== 1) {
              throw new Error("INSUFFICIENT_STOCK");
            }
          }

          const order = await tx.order.create({
            data: {
              businessAccountId,
              customerId: customer.id,
              customerAddressId: customerAddress.id,
              deliveryRecipientName: customerAddress.recipientName,
              deliveryRecipientPhone: customerAddress.recipientPhone,
              deliveryStreetAddress: customerAddress.streetAddress,
              deliveryCity: customerAddress.city,
              deliveryState: customerAddress.state,
              deliveryLandmark: customerAddress.landmark,
              deliveryLatitude: customerAddress.latitude,
              deliveryLongitude: customerAddress.longitude,
              orderNumber: `ORD-${randomUUID()}`,
              idempotencyKey: input.idempotencyKey,
              subtotal,
              discount,
              total,
              currency: business.currency,
              notes: input.notes,
              items: {
                create: orderItems,
              },
            },
            include: {
              items: true,
            },
          });

          return serializeOrder(order);
        },
        {
          isolationLevel: "Serializable",
        },
      );
    } catch (error) {
      const errorCode = getPrismaErrorCode(error);

      if (errorCode === "P2002" || errorCode === "P2034") {
        // Another concurrent request may have completed this order.
        const existingOrder = await getMatchingExistingOrder(
          businessAccountId,
          input,
        );

        if (existingOrder) {
          return existingOrder;
        }

        // Retry serialization conflicts if no matching order exists.
        if (
          errorCode === "P2034" &&
          attempt < MAX_TRANSACTION_ATTEMPTS
        ) {
          continue;
        }

        if (errorCode === "P2034") {
          throw new Error("ORDER_CONCURRENCY_RETRY_EXHAUSTED");
        }
      }

      throw error;
    }
  }

  throw new Error("ORDER_CONCURRENCY_RETRY_EXHAUSTED");
}

export async function listOrders(businessAccountId: string) {
  const orders = await prisma.order.findMany({
    where: {
      businessAccountId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return orders.map(serializeOrder);
}

export async function getOrderById(
  businessAccountId: string,
  orderId: string,
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      businessAccountId,
    },
    include: {
      items: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return order ? serializeOrder(order) : null;
}
