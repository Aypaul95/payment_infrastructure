import { Prisma } from "../generated/prisma/client";
import type { Prisma as PrismaTypes } from "../generated/prisma/client";

const EARTH_RADIUS_KM = 6371.0088;
const MILLI_KM = 1000n;
const SERVICE_FEE_BPS_DENOMINATOR = 10000n;

export type Coordinates = {
  latitude: Prisma.Decimal | number | string;
  longitude: Prisma.Decimal | number | string;
};

export type DeliveryPricingConfig = {
  deliveryBaseFee: bigint;
  deliveryFeePerKm: bigint;
  minimumDeliveryFee: bigint;
  maximumDeliveryDistanceKm: Prisma.Decimal;
  serviceFeeRateBps: number;
  serviceFeeCap: bigint;
};

export type CalculatedDeliveryPricing = {
  deliveryDistanceKm: Prisma.Decimal;
  deliveryDistanceSource: "STRAIGHT_LINE_ESTIMATE";
  deliveryFee: bigint;
  serviceFee: bigint;
  serviceFeeRateBps: number;
};

function coordinateToNumber(value: Prisma.Decimal | number | string) {
  const result = Number(value.toString());

  if (!Number.isFinite(result)) {
    throw new Error("INVALID_DELIVERY_COORDINATES");
  }

  return result;
}

function validateCoordinates(coordinates: Coordinates) {
  const latitude = coordinateToNumber(coordinates.latitude);
  const longitude = coordinateToNumber(coordinates.longitude);

  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("INVALID_DELIVERY_COORDINATES");
  }

  return { latitude, longitude };
}

function toMilliKm(distanceKm: number): bigint {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error("INVALID_DELIVERY_DISTANCE");
  }

  return BigInt(Math.round(distanceKm * Number(MILLI_KM)));
}

function milliKmToDecimal(milliKm: bigint): Prisma.Decimal {
  return new Prisma.Decimal(milliKm.toString()).dividedBy(1000);
}

function decimalKmToMilliKm(distanceKm: Prisma.Decimal): bigint {
  const scaled = distanceKm.mul(1000);

  if (!scaled.isInteger()) {
    throw new Error("INVALID_PRICING_CONFIGURATION");
  }

  return BigInt(scaled.toFixed(0));
}

export function calculateStraightLineDistance(
  pickup: Coordinates,
  dropoff: Coordinates,
) {
  const start = validateCoordinates(pickup);
  const end = validateCoordinates(dropoff);

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(
    end.latitude - start.latitude,
  );
  const longitudeDifference = toRadians(
    end.longitude - start.longitude,
  );

  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

    const rawHaversine =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(startLatitude) *
        Math.cos(endLatitude) *
        Math.sin(longitudeDifference / 2) ** 2;

    const haversine = Math.min(1, Math.max(0, rawHaversine));

  const angularDistance =
    2 * Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    );

  return toMilliKm(EARTH_RADIUS_KM * angularDistance);
}

export function calculateDeliveryPricing(params: {
  pickup: Coordinates;
  dropoff: Coordinates;
  discountedSubtotal: bigint;
  config: DeliveryPricingConfig;
}): CalculatedDeliveryPricing {
  const { pickup, dropoff, discountedSubtotal, config } = params;

  if (
    discountedSubtotal < 0n ||
    config.deliveryBaseFee < 0n ||
    config.deliveryFeePerKm < 0n ||
    config.minimumDeliveryFee < 0n ||
    config.serviceFeeCap < 0n ||
    !Number.isInteger(config.serviceFeeRateBps) ||
    config.serviceFeeRateBps < 0 ||
    config.serviceFeeRateBps > 10000
  ) {
    throw new Error("INVALID_PRICING_CONFIGURATION");
  }

  const distanceMilliKm = calculateStraightLineDistance(
    pickup,
    dropoff,
  );

  const maximumDistanceMilliKm = decimalKmToMilliKm(
    config.maximumDeliveryDistanceKm,
  );

  if (
    maximumDistanceMilliKm <= 0n ||
    distanceMilliKm > maximumDistanceMilliKm
  ) {
    throw new Error("DELIVERY_DISTANCE_EXCEEDS_LIMIT");
  }

  const distanceFee =
    (distanceMilliKm * config.deliveryFeePerKm + 500n) / 1000n;

  const calculatedDeliveryFee =
    config.deliveryBaseFee + distanceFee;

  const deliveryFee =
    calculatedDeliveryFee < config.minimumDeliveryFee
      ? config.minimumDeliveryFee
      : calculatedDeliveryFee;

  const calculatedServiceFee =
    (discountedSubtotal *
      BigInt(config.serviceFeeRateBps) +
      SERVICE_FEE_BPS_DENOMINATOR / 2n) /
    SERVICE_FEE_BPS_DENOMINATOR;

  const serviceFee =
    calculatedServiceFee < config.serviceFeeCap
      ? calculatedServiceFee
      : config.serviceFeeCap;

  return {
    deliveryDistanceKm: milliKmToDecimal(distanceMilliKm),
    deliveryDistanceSource: "STRAIGHT_LINE_ESTIMATE",
    deliveryFee,
    serviceFee,
    serviceFeeRateBps: config.serviceFeeRateBps,
  };
}

export async function getActiveDeliveryPricingConfig(
  tx: PrismaTypes.TransactionClient,
): Promise<DeliveryPricingConfig> {
  const config = await tx.platformPricingConfig.findUnique({
    where: { id: "default" },
  });

  if (!config || !config.isActive) {
    throw new Error("PRICING_CONFIGURATION_UNAVAILABLE");
  }

  return config;
}