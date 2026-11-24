import { test } from "node:test";
import assert from "node:assert/strict";

import { Prisma } from "../src/generated/prisma/client";

import {
  persistRiderEarning,
} from "../src/services/rider-earnings.persistence.service.ts";

import {
  calculateRiderEarning,
} from "../src/services/rider-earnings.service.ts";

import type {
  PersistRiderEarningInput,
} from "../src/services/rider-earnings.persistence.service.ts";

const deliveredAt = new Date("2026-11-19T10:00:00.000Z");

const calculation = calculateRiderEarning({
  baseAmount: 50000n,
  distanceKm: "12.500",
  ratePerKm: 10000n,
  incentiveAmount: 5000n,
  commissionAmount: 3000n,
  deductionAmount: 2000n,
});

const input: PersistRiderEarningInput = {
  deliveryId: "delivery-test-123",
  riderId: "rider-test-123",
  calculation,
};

function createTransactionMocks(overrides: {
  delivery?: Record<string, unknown> | null;
  existingEarning?: { id: string } | null;
} = {}) {
  let createCalls = 0;
  let createdData: Record<string, unknown> | undefined;

  const tx = {
    delivery: {
      findUnique: async () =>
        overrides.delivery === undefined
          ? {
              id: input.deliveryId,
              assignedRiderId: input.riderId,
              status: "DELIVERED",
              deliveredAt,
            }
          : overrides.delivery,
    },

    riderEarning: {
      findUnique: async () => overrides.existingEarning ?? null,

      create: async ({ data }: { data: Record<string, unknown> }) => {
        createCalls++;
        createdData = data;
        return data;
      },
    },
  };

  return {
    tx: tx as unknown as Prisma.TransactionClient,
    getCreateCalls: () => createCalls,
    getCreatedData: () => createdData,
  };
}

test("creates a pending earning for a completed delivery", async () => {
  const mocks = createTransactionMocks();

  const result = await persistRiderEarning(mocks.tx, input);

  assert.equal(mocks.getCreateCalls(), 1);

  const data = mocks.getCreatedData();

  assert.ok(data);
  if (!data) {
    throw new Error("EXPECTED_CREATED_EARNING_DATA");
  }

  assert.equal(data.riderId, input.riderId);
  assert.equal(data.deliveryId, input.deliveryId);
  assert.equal(data.baseAmount, 50000n);
  assert.equal(data.distanceAmount, 125000n);
  assert.equal(data.grossAmount, 180000n);
  assert.equal(data.netAmount, 175000n);
  assert.equal(data.status, "PENDING");
  assert.equal(data.earnedAt, deliveredAt);

  assert.equal(result.status, "PENDING");
});

test("rejects earning creation when delivery does not exist", async () => {
  const mocks = createTransactionMocks({
    delivery: null,
  });

  await assert.rejects(
    persistRiderEarning(mocks.tx, input),
    { message: "DELIVERY_NOT_FOUND" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects earning creation when delivery is not completed", async () => {
  const mocks = createTransactionMocks({
    delivery: {
      id: input.deliveryId,
      assignedRiderId: input.riderId,
      status: "IN_TRANSIT",
      deliveredAt: null,
    },
  });

  await assert.rejects(
    persistRiderEarning(mocks.tx, input),
    { message: "DELIVERY_NOT_COMPLETED" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects earning creation when rider is not assigned to delivery", async () => {
  const mocks = createTransactionMocks({
    delivery: {
      id: input.deliveryId,
      assignedRiderId: "another-rider-123",
      status: "DELIVERED",
      deliveredAt,
    },
  });

  await assert.rejects(
    persistRiderEarning(mocks.tx, input),
    { message: "RIDER_DELIVERY_MISMATCH" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects duplicate earnings for the same delivery", async () => {
  const mocks = createTransactionMocks({
    existingEarning: {
      id: "existing-earning-123",
    },
  });

  await assert.rejects(
    persistRiderEarning(mocks.tx, input),
    { message: "RIDER_EARNING_ALREADY_EXISTS" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects inconsistent gross and net earning calculations", async () => {
  const mocks = createTransactionMocks();

  const invalidInput: PersistRiderEarningInput = {
    ...input,
    calculation: {
      ...calculation,
      grossAmount: 999999n,
    },
  };

  await assert.rejects(
    persistRiderEarning(mocks.tx, invalidInput),
    { message: "INVALID_EARNING_CALCULATION" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects negative financial components", async () => {
  const mocks = createTransactionMocks();

  const invalidInput: PersistRiderEarningInput = {
    ...input,
    calculation: {
      ...calculation,
      baseAmount: -100n,
      grossAmount: 129900n,
      netAmount: 124900n,
    },
  };

  await assert.rejects(
    persistRiderEarning(mocks.tx, invalidInput),
    { message: "INVALID_EARNING_CALCULATION" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects incorrect distance compensation", async () => {
  const mocks = createTransactionMocks();

  const invalidInput: PersistRiderEarningInput = {
    ...input,
    calculation: {
      ...calculation,
      distanceAmount: 100000n,
      grossAmount: 155000n,
      netAmount: 150000n,
    },
  };

  await assert.rejects(
    persistRiderEarning(mocks.tx, invalidInput),
    { message: "INVALID_EARNING_CALCULATION" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects distance exceeding the database column limit", async () => {
  const mocks = createTransactionMocks();

  const invalidInput: PersistRiderEarningInput = {
    ...input,
    calculation: {
      ...calculation,
      distanceKm: "100000000.000",
    },
  };

  await assert.rejects(
    persistRiderEarning(mocks.tx, invalidInput),
    { message: "INVALID_EARNING_CALCULATION" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects distance with more than three decimal places", async () => {
  const mocks = createTransactionMocks();

  const invalidInput: PersistRiderEarningInput = {
    ...input,
    calculation: {
      ...calculation,
      distanceKm: "12.5001",
    },
  };

  await assert.rejects(
    persistRiderEarning(mocks.tx, invalidInput),
    { message: "INVALID_EARNING_CALCULATION" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects financial amounts exceeding PostgreSQL BIGINT maximum", async () => {
  const mocks = createTransactionMocks();

  const invalidInput: PersistRiderEarningInput = {
    ...input,
    calculation: {
      ...calculation,
      baseAmount: 9_223_372_036_854_775_808n,
      grossAmount:
        9_223_372_036_854_775_808n +
        calculation.distanceAmount +
        calculation.incentiveAmount,
      netAmount:
        9_223_372_036_854_775_808n +
        calculation.distanceAmount +
        calculation.incentiveAmount -
        calculation.commissionAmount -
        calculation.deductionAmount,
    },
  };

  await assert.rejects(
    persistRiderEarning(mocks.tx, invalidInput),
    { message: "INVALID_EARNING_CALCULATION" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});