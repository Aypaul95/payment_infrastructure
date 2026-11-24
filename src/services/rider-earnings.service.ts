export interface RiderEarningCalculationInput {
  baseAmount: bigint;
  distanceKm: string;
  ratePerKm: bigint;
  incentiveAmount?: bigint;
  commissionAmount?: bigint;
  deductionAmount?: bigint;
  currency?: string;
}

export interface RiderEarningCalculationResult {
  distanceKm: string;
  baseAmount: bigint;
  ratePerKm: bigint;
  distanceAmount: bigint;
  incentiveAmount: bigint;
  grossAmount: bigint;
  commissionAmount: bigint;
  deductionAmount: bigint;
  netAmount: bigint;
  currency: string;
}

function parseDistanceKm(distanceKm: string): bigint {
  if (!/^\d+(\.\d{1,3})?$/.test(distanceKm)) {
    throw new Error("INVALID_DISTANCE");
  }

  const [whole, fraction = ""] = distanceKm.split(".");
  const milliKm = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));

  if (milliKm <= 0n) {
    throw new Error("INVALID_DISTANCE");
  }

  return milliKm;
}

export function calculateRiderEarning(
  input: RiderEarningCalculationInput,
): RiderEarningCalculationResult {
  const {
    baseAmount,
    distanceKm,
    ratePerKm,
    incentiveAmount = 0n,
    commissionAmount = 0n,
    deductionAmount = 0n,
    currency = "NGN",
  } = input;

  if (
    baseAmount < 0n ||
    ratePerKm < 0n ||
    incentiveAmount < 0n ||
    commissionAmount < 0n ||
    deductionAmount < 0n
  ) {
    throw new Error("INVALID_EARNING_AMOUNT");
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("INVALID_CURRENCY");
  }

  const milliKm = parseDistanceKm(distanceKm);

  // Distance is stored in thousandths of a kilometre.
  // Round the final distance compensation to the nearest kobo.
  const distanceAmount = (milliKm * ratePerKm + 500n) / 1000n;

  const grossAmount =
    baseAmount + distanceAmount + incentiveAmount;

  const totalDeductions = commissionAmount + deductionAmount;

  if (totalDeductions > grossAmount) {
    throw new Error("DEDUCTIONS_EXCEED_GROSS");
  }

  const netAmount = grossAmount - totalDeductions;

  return {
      distanceKm: `${milliKm / 1000n}.${(milliKm % 1000n)
          .toString()
          .padStart(3, "0")}`,
    baseAmount,
    ratePerKm,
    distanceAmount,
    incentiveAmount,
    grossAmount,
    commissionAmount,
    deductionAmount,
    netAmount,
    currency,
  };
}