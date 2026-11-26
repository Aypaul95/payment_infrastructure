import { prisma } from "../lib/prisma";
import {
  generateDeliveryConfirmationCode,
  verifyDeliveryConfirmationCode,
  deliveryConfirmationLimits,
} from "./delivery-confirmation.service";
import { encryptSmsPayload } from "../lib/sms-encryption";
import { toTermiiPhoneNumber } from "../lib/phone";

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

      const pickup = order;

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


type RiderDeliveryAction =
  | "ACCEPT"
  | "PICKUP"
  | "START"
  | "COMPLETE";

const riderDeliveryTransitions = {
  ACCEPT: {
    from: "ASSIGNED",
    to: "ACCEPTED",
    timestamp: "acceptedAt",
    notes: "Delivery accepted by the assigned rider.",
  },
  PICKUP: {
    from: "ACCEPTED",
    to: "PICKED_UP",
    timestamp: "pickedUpAt",
    notes: "Pickup confirmed by the assigned rider.",
  },
  START: {
    from: "PICKED_UP",
    to: "IN_TRANSIT",
    timestamp: null,
    notes: "Delivery journey started by the assigned rider.",
  },
  COMPLETE: {
    from: "IN_TRANSIT",
    to: "DELIVERED",
    timestamp: "deliveredAt",
    notes: "Delivery completed by the assigned rider.",
  },
} as const;

export async function progressRiderDelivery(
  deliveryId: string,
  riderId: string,
  action: RiderDeliveryAction,
  confirmationCode?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const lockedDeliveries = await tx.$queryRaw<
      Array<{ id: string }>
    >`
      SELECT "id"
      FROM "Delivery"
      WHERE "id" = ${deliveryId}
      FOR UPDATE
    `;

    if (lockedDeliveries.length === 0) {
      throw new Error("DELIVERY_NOT_FOUND");
    }

    const delivery = await tx.delivery.findUniqueOrThrow({
      where: { id: deliveryId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (delivery.assignedRiderId !== riderId) {
      throw new Error("DELIVERY_NOT_ASSIGNED_TO_RIDER");
    }

    const rider = await tx.rider.findFirst({
      where: {
        id: riderId,
        approvalStatus: "APPROVED",
        isActive: true,
      },
      select: { id: true },
    });

    if (!rider) {
      throw new Error("RIDER_NOT_ELIGIBLE");
    }

    const transition = riderDeliveryTransitions[action];

    if (delivery.status !== transition.from) {
      throw new Error("INVALID_DELIVERY_STATUS_TRANSITION");
    }

    if (
      action === "PICKUP" &&
      delivery.order.status !== "READY_FOR_DELIVERY"
    ) {
      throw new Error("ORDER_STATUS_CONFLICT");
    }

    if (
      action === "COMPLETE" &&
      delivery.order.status !== "OUT_FOR_DELIVERY"
    ) {
      throw new Error("ORDER_STATUS_CONFLICT");
    }

      if (action === "COMPLETE") {
          if (delivery.confirmationAttempts >= deliveryConfirmationLimits.maxAttempts) {
              throw new Error("CONFIRMATION_ATTEMPTS_EXCEEDED");
          }

          if (
              !confirmationCode ||
              !delivery.confirmationCodeHash ||
              !delivery.confirmationCodeExpiresAt ||
              delivery.confirmationCodeExpiresAt <= new Date()
          ) {
              return null;
          }

          const isValid = verifyDeliveryConfirmationCode(
              confirmationCode,
              delivery.confirmationCodeHash,
          );

          if (!isValid) {
              await tx.delivery.update({
                  where: { id: deliveryId },
                  data: {
                      confirmationAttempts: { increment: 1 },
                  },
              });

              return null;
          }

          await tx.delivery.update({
              where: { id: deliveryId },
              data: {
                  confirmationVerifiedAt: new Date(),
              },
          });
      }

    if (action === "PICKUP") {
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: delivery.order.id,
          status: "READY_FOR_DELIVERY",
        },
        data: {
          status: "OUT_FOR_DELIVERY",
        },
      });

      if (updatedOrder.count !== 1) {
        throw new Error("ORDER_STATUS_CONFLICT");
      }
    }

    if (action === "COMPLETE") {
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: delivery.order.id,
          status: "OUT_FOR_DELIVERY",
        },
        data: {
          status: "DELIVERED",
        },
      });

      if (updatedOrder.count !== 1) {
        throw new Error("ORDER_STATUS_CONFLICT");
      }
    }
      const confirmationNotification =
          action === "START"
              ? (() => {
                  const generated = generateDeliveryConfirmationCode();

                  const to = toTermiiPhoneNumber(
                      delivery.dropoffRecipientPhone,
                  );

                  const message =
                      `PAYINFRA: Your delivery confirmation code is ${generated.code}. ` +
                      "Share this code with your rider only after your order has arrived. " +
                      "This code expires in 60 minutes.";

                  return {
                      to,
                      hash: generated.hash,
                      expiresAt: generated.expiresAt,
                      encryptedPayload: encryptSmsPayload(message),
                  };
              })()
              : null;
    const timestamp = new Date();

    const updatedDelivery = await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: transition.to,
          ...(confirmationNotification
              ? {
                  confirmationCodeHash: confirmationNotification.hash,
                  confirmationCodeExpiresAt: confirmationNotification.expiresAt,
                  confirmationAttempts: 0,
                  confirmationVerifiedAt: null,
              }
              : {}),
        ...(transition.timestamp === "acceptedAt"
          ? { acceptedAt: timestamp }
          : {}),
        ...(transition.timestamp === "pickedUpAt"
          ? { pickedUpAt: timestamp }
          : {}),
        ...(transition.timestamp === "deliveredAt"
          ? { deliveredAt: timestamp }
          : {}),
        statusHistory: {
          create: {
            fromStatus: transition.from,
            toStatus: transition.to,
            actorId: riderId,
            actorType: "RIDER",
            notes: transition.notes,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

      if (confirmationNotification) {
          await tx.smsOutbox.create({
              data: {
                  deliveryId,
                  recipientPhone: confirmationNotification.to,
                  encryptedPayload: confirmationNotification.encryptedPayload,
              },
          });
      }

      return {
          delivery: updatedDelivery,
      };
  });

    if (!result) {
        throw new Error("INVALID_CONFIRMATION_CODE");
    }

    const {
        confirmationCodeHash,
        confirmationCodeExpiresAt,
        confirmationAttempts,
        confirmationVerifiedAt,
        ...safeDelivery
    } = result.delivery;

    return safeDelivery;
}