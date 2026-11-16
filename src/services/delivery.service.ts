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

export async function assignDelivery(
  businessAccountId: string,
  orderId: string,
  riderId: string,
  actorId: string,
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const deliveries = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT d."id"
      FROM "Delivery" d
      INNER JOIN "Order" o ON o."id" = d."orderId"
      WHERE
        o."id" = ${orderId}
        AND o."businessAccountId" = ${businessAccountId}
      FOR UPDATE OF d
    `;

    if (deliveries.length === 0) {
      throw new Error("DELIVERY_NOT_FOUND");
    }
    const deliveryId = deliveries[0].id;

    const delivery = await tx.delivery.findUniqueOrThrow({
      where: { id: deliveryId },
    });

    if (delivery.status !== "REQUESTED" && delivery.status !== "ASSIGNED") {
      throw new Error("DELIVERY_CANNOT_BE_ASSIGNED");
    }

    if (delivery.assignedRiderId === riderId) {
      return tx.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          assignmentHistory: {
            orderBy: { createdAt: "asc" },
          },
          statusHistory: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    const rider = await tx.rider.findFirst({
      where: {
        id: riderId,
        approvalStatus: "APPROVED",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!rider) {
      throw new Error("RIDER_NOT_ELIGIBLE");
    }

    const previousRiderId = delivery.assignedRiderId;

    const updatedDelivery = await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        assignedRiderId: rider.id,
        assignedAt: new Date(),

        ...(delivery.status === "REQUESTED"
          ? { status: "ASSIGNED" as const }
          : {}),

        assignmentHistory: {
          create: {
            previousRiderId,
            newRiderId: rider.id,
            assignedById: actorId,
            assignedByType: "BUSINESS_USER",
            reason,
          },
        },

        ...(delivery.status === "REQUESTED"
          ? {
              statusHistory: {
                create: {
                  fromStatus: "REQUESTED",
                  toStatus: "ASSIGNED",
                  actorId,
                  actorType: "BUSINESS_USER",
                  notes: "Rider assigned by the business.",
                },
              },
            }
          : {}),
      },
      include: {
        assignmentHistory: {
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return updatedDelivery;
  });
}
