import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculateRiderEarning,
} from "../src/services/rider-earnings.service.ts";

test("calculates base, distance, incentives, commission and net earning", () => {
  const result = calculateRiderEarning({
    baseAmount: 50000n,
    distanceKm: "12.500",
    ratePerKm: 10000n,
    incentiveAmount: 5000n,
    commissionAmount: 3000n,
    deductionAmount: 2000n,
  });

  assert.equal(result.distanceAmount, 125000n);
  assert.equal(result.grossAmount, 180000n);
  assert.equal(result.netAmount, 175000n);
  assert.equal(result.currency, "NGN");
});

test("rounds distance compensation to the nearest kobo", () => {
  const result = calculateRiderEarning({
    baseAmount: 0n,
    distanceKm: "1.000",
    ratePerKm: 1001n,
  });

  assert.equal(result.distanceAmount, 1001n);
});

test("supports distances with three decimal places", () => {
  const result = calculateRiderEarning({
    baseAmount: 0n,
    distanceKm: "0.125",
    ratePerKm: 8000n,
  });

  assert.equal(result.distanceKm, "0.125");
  assert.equal(result.distanceAmount, 1000n);
});

test("defaults optional amounts to zero", () => {
  const result = calculateRiderEarning({
    baseAmount: 1000n,
    distanceKm: "2",
    ratePerKm: 500n,
  });

  assert.equal(result.incentiveAmount, 0n);
  assert.equal(result.commissionAmount, 0n);
  assert.equal(result.deductionAmount, 0n);
  assert.equal(result.netAmount, result.grossAmount);
});

test("rejects negative earning amounts", () => {
  assert.throws(
    () =>
      calculateRiderEarning({
        baseAmount: -1n,
        distanceKm: "1",
        ratePerKm: 1000n,
      }),
    { message: "INVALID_EARNING_AMOUNT" },
  );
});

test("rejects deductions greater than gross earnings", () => {
  assert.throws(
    () =>
      calculateRiderEarning({
        baseAmount: 1000n,
        distanceKm: "1",
        ratePerKm: 0n,
        commissionAmount: 1001n,
      }),
    { message: "DEDUCTIONS_EXCEED_GROSS" },
  );
});

test("rejects zero distance", () => {
  assert.throws(
    () =>
      calculateRiderEarning({
        baseAmount: 1000n,
        distanceKm: "0",
        ratePerKm: 1000n,
      }),
    { message: "INVALID_DISTANCE" },
  );
});

test("rejects invalid distance formats", () => {
  const invalidDistances = [
    "-1",
    "1.1234",
    "1..2",
    "abc",
    "",
    "1 km",
  ];

  for (const distanceKm of invalidDistances) {
    assert.throws(
      () =>
        calculateRiderEarning({
          baseAmount: 1000n,
          distanceKm,
          ratePerKm: 1000n,
        }),
      { message: "INVALID_DISTANCE" },
    );
  }
});

test("rejects invalid currency codes", () => {
  assert.throws(
    () =>
      calculateRiderEarning({
        baseAmount: 1000n,
        distanceKm: "1",
        ratePerKm: 1000n,
        currency: "naira",
      }),
    { message: "INVALID_CURRENCY" },
  );
});

test("rounds half-kobo compensation upward", () => {
  const result = calculateRiderEarning({
    baseAmount: 0n,
    distanceKm: "0.001",
    ratePerKm: 500n,
  });

  assert.equal(result.distanceAmount, 1n);
});

test("rounds compensation below half a kobo down", () => {
  const result = calculateRiderEarning({
    baseAmount: 0n,
    distanceKm: "0.001",
    ratePerKm: 499n,
  });

  assert.equal(result.distanceAmount, 0n);
});