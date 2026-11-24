import { Prisma } from "../generated/prisma/client";
import type { RiderEarningCalculationResult } from "./rider-earnings.service";

export interface PersistRiderEarningInput {
  deliveryId: string;
  riderId: string;
  calculation: RiderEarningCalculationResult;
}
export async function persistRiderEarning(
  tx: Prisma.TransactionClient,
  input: PersistRiderEarningInput,
) {
  const { deliveryId, riderId, calculation } = input;
  const amounts = [
    calculation.baseAmount,
    calculation.ratePerKm,
    calculation.distanceAmount,
    calculation.incentiveAmount,
    calculation.commissionAmount,
    calculation.deductionAmount,
    calculation.grossAmount,
    calculation.netAmount,
  ];

    const POSTGRES_BIGINT_MAX = 9_223_372_036_854_775_807n;
    const MAX_DISTANCE_MILLI_KM = 9_999_999_999n;

    const hasInvalidAmount = amounts.some(
        (amount) =>
            amount < 0n || amount > POSTGRES_BIGINT_MAX,
    );

    const validDistanceFormat =
        /^\d+(?:\.\d{1,3})?$/.test(calculation.distanceKm);

    if (!validDistanceFormat) {
        throw new Error("INVALID_EARNING_CALCULATION");
    }

    const [whole, fraction = ""] = calculation.distanceKm.split(".");

    const milliKm =
        BigInt(whole) * 1000n +
        BigInt(fraction.padEnd(3, "0"));

    if (
        milliKm <= 0n ||
        milliKm > MAX_DISTANCE_MILLI_KM
    ) {
        throw new Error("INVALID_EARNING_CALCULATION");
    }

    const expectedDistanceAmount =
        (milliKm * calculation.ratePerKm + 500n) / 1000n;

    const expectedGross =
        calculation.baseAmount +
        calculation.distanceAmount +
        calculation.incentiveAmount;

    const expectedNet =
        expectedGross -
        calculation.commissionAmount -
        calculation.deductionAmount;

    if (
        hasInvalidAmount ||
        calculation.distanceAmount !== expectedDistanceAmount ||
        calculation.grossAmount !== expectedGross ||
        calculation.netAmount !== expectedNet ||
        expectedNet < 0n ||
        expectedGross > POSTGRES_BIGINT_MAX ||
        !/^[A-Z]{3}$/.test(calculation.currency)
    ) {
        throw new Error("INVALID_EARNING_CALCULATION");
    }

  const delivery = await tx.delivery.findUnique({
    where: {
      id: deliveryId,
    },
    select: {
      id: true,
      assignedRiderId: true,
      status: true,
      deliveredAt: true,
    },
  });

  if (!delivery) {
    throw new Error("DELIVERY_NOT_FOUND");
  }

  if (delivery.status !== "DELIVERED" || !delivery.deliveredAt) {
    throw new Error("DELIVERY_NOT_COMPLETED");
  }

  if (delivery.assignedRiderId !== riderId) {
    throw new Error("RIDER_DELIVERY_MISMATCH");
  }
    const existingEarning = await tx.riderEarning.findUnique({
        where: {
            deliveryId,
        },
        select: {
            id: true,
        },
    });

    if (existingEarning) {
        throw new Error("RIDER_EARNING_ALREADY_EXISTS");
    }
  return tx.riderEarning.create({
    data: {
      riderId,
      deliveryId,

      baseAmount: calculation.baseAmount,
      distanceKm: new Prisma.Decimal(calculation.distanceKm),
      ratePerKm: calculation.ratePerKm,
      distanceAmount: calculation.distanceAmount,
      incentiveAmount: calculation.incentiveAmount,

      grossAmount: calculation.grossAmount,
      commissionAmount: calculation.commissionAmount,
      deductionAmount: calculation.deductionAmount,
      netAmount: calculation.netAmount,

      currency: calculation.currency,
      status: "PENDING",
      earnedAt: delivery.deliveredAt,
    },
  });
}
