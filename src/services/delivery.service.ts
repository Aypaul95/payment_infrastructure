
import { prisma } from "../lib/prisma";

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

export async function requestDelivery(
  businessAccountId: string,
  orderId: string,
  actorId: string,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          businessAccountId,
        },
        include: {
          delivery: true,
          businessAccount: {
            select: {
              pickupStreetAddress: true,
              pickupCity: true,
              pickupState: true,
              pickupLandmark: true,
              pickupLatitude: true,
              pickupLongitude: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.delivery) {
        return order.delivery;
      }

      if (order.status !== "READY_FOR_DELIVERY") {
        throw new Error("ORDER_NOT_READY_FOR_DELIVERY");
      }

      const pickup = order.businessAccount;

      if (
        !pickup.pickupStreetAddress ||
        !pickup.pickupCity ||
        !pickup.pickupState ||
        pickup.pickupLatitude === null ||
        pickup.pickupLongitude === null
      ) {
        throw new Error("BUSINESS_PICKUP_LOCATION_INCOMPLETE");
      }

      const delivery = await tx.delivery.create({
        data: {
          orderId: order.id,

          pickupStreetAddress: pickup.pickupStreetAddress,
          pickupCity: pickup.pickupCity,
          pickupState: pickup.pickupState,
          pickupLandmark: pickup.pickupLandmark,
          pickupLatitude: pickup.pickupLatitude,
          pickupLongitude: pickup.pickupLongitude,

          dropoffRecipientName: order.deliveryRecipientName,
          dropoffRecipientPhone: order.deliveryRecipientPhone,
          dropoffStreetAddress: order.deliveryStreetAddress,
          dropoffCity: order.deliveryCity,
          dropoffState: order.deliveryState,
          dropoffLandmark: order.deliveryLandmark,
          dropoffLatitude: order.deliveryLatitude,
          dropoffLongitude: order.deliveryLongitude,

          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "REQUESTED",
              actorId,
              actorType: "BUSINESS_USER",
              notes: "Delivery requested by the business.",
            },
          },
        },
        include: {
          statusHistory: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return delivery;
    });
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2002") {
      const existingDelivery = await prisma.delivery.findUnique({
        where: {
          orderId,
        },
        include: {
          statusHistory: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (existingDelivery) {
        return existingDelivery;
      }
    }

    throw error;
  }
}
