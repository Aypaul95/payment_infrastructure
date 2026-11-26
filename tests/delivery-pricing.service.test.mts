import { test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../src/generated/prisma/client";

import {
  calculateStraightLineDistance,
  calculateDeliveryPricing,
} from "../src/services/delivery-pricing.service.ts";

const config = {
  deliveryBaseFee: 1000n,
  deliveryFeePerKm: 100n,
  minimumDeliveryFee: 1500n,
  maximumDeliveryDistanceKm: new Prisma.Decimal("25.000"),
  serviceFeeRateBps: 500,
  serviceFeeCap: 1000n,
};

const pickup = {
  latitude: -8.4966,
  longitude: 4.5421,
};

test("calculates zero distance for identical coordinates", () => {
  const distance = calculateStraightLineDistance(pickup, pickup);

  assert.equal(distance, 0n);
});

test("calculates delivery and service fees correctly", () => {
  const result = calculateDeliveryPricing({
    pickup,
    dropoff: pickup,
    discountedSubtotal: 4500n,
    config,
  });

  assert.equal(result.deliveryDistanceKm.toString(), "0");
  assert.equal(result.deliveryFee, 1500n);
  assert.equal(result.serviceFee, 225n);
  assert.equal(result.serviceFeeRateBps, 500);
  assert.equal(result.deliveryDistanceSource, "STRAIGHT_LINE_ESTIMATE");
});

test("calculates the distance-based delivery fee", () => {
  const result = calculateDeliveryPricing({
    pickup: { latitude: 0, longitude: 0 },
    dropoff: { latitude: 0, longitude: 0.01 },
    discountedSubtotal: 5000n,
    config: {
      ...config,
      minimumDeliveryFee: 0n,
    },
  });

  assert.equal(result.deliveryDistanceKm.toString(), "1.112");
  assert.equal(result.deliveryFee, 1111n);
  assert.equal(result.serviceFee, 250n);
});

test("applies the service fee cap", () => {
  const result = calculateDeliveryPricing({
    pickup,
    dropoff: pickup,
    discountedSubtotal: 50000n,
    config,
  });

  assert.equal(result.serviceFee, 1000n);
});

test("rejects delivery distances above the configured maximum", () => {
  assert.throws(
    () =>
      calculateDeliveryPricing({
        pickup: { latitude: 0, longitude: 0 },
        dropoff: { latitude: 0, longitude: 1 },
        discountedSubtotal: 5000n,
        config,
      }),
    { message: "DELIVERY_DISTANCE_EXCEEDS_LIMIT" },
  );
});

test("rejects invalid coordinates", () => {
  assert.throws(
    () =>
      calculateStraightLineDistance(
        { latitude: 91, longitude: 0 },
        pickup,
      ),
    { message: "INVALID_DELIVERY_COORDINATES" },
  );
});

test("rejects negative discounted subtotals", () => {
  assert.throws(
    () =>
      calculateDeliveryPricing({
        pickup,
        dropoff: pickup,
        discountedSubtotal: -1n,
        config,
      }),
    { message: "INVALID_PRICING_CONFIGURATION" },
  );
});

test("rejects invalid service fee rates", () => {
  assert.throws(
    () =>
      calculateDeliveryPricing({
        pickup,
        dropoff: pickup,
        discountedSubtotal: 5000n,
        config: {
          ...config,
          serviceFeeRateBps: 10001,
        },
      }),
    { message: "INVALID_PRICING_CONFIGURATION" },
  );
});
