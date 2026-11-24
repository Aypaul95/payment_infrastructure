
import { test } from "node:test";
import assert from "node:assert/strict";

import { Prisma } from "../src/generated/prisma/client";

import {
  recordRiderWalletTransaction,
} from "../src/services/rider-wallet-ledger.service.ts";

import type {
  RecordWalletTransactionInput,
} from "../src/services/rider-wallet-ledger.service.ts";

const baseInput: RecordWalletTransactionInput = {
  walletId: "wallet-test-123",
  type: "CREDIT",
  amount: 50000n,
  reference: "wallet-test-reference",
};

function createTransactionMocks(updateCount = 1) {
  let updateCalls = 0;
  let createCalls = 0;
  let updateArgs: Record<string, any> | undefined;
  let createdData: Record<string, any> | undefined;

  const tx = {
    riderWallet: {
      updateMany: async (args: Record<string, any>) => {
        updateCalls++;
        updateArgs = args;
        return { count: updateCount };
      },
    },

    riderWalletTransaction: {
      create: async ({ data }: { data: Record<string, any> }) => {
        createCalls++;
        createdData = data;
        return data;
      },
    },
  };

  return {
    tx: tx as unknown as Prisma.TransactionClient,
    getUpdateCalls: () => updateCalls,
    getCreateCalls: () => createCalls,
    getUpdateArgs: () => updateArgs,
    getCreatedData: () => createdData,
  };
}

test("credits available wallet balance", async () => {
  const mocks = createTransactionMocks();

  await recordRiderWalletTransaction(mocks.tx, baseInput);

  assert.equal(mocks.getUpdateCalls(), 1);
  assert.equal(mocks.getCreateCalls(), 1);

  const args = mocks.getUpdateArgs();

  assert.equal(args?.where.id, baseInput.walletId);
  assert.equal(args?.where.currency, "NGN");
  assert.equal(args?.data.availableBalance.increment, 50000n);

  const data = mocks.getCreatedData();

  assert.equal(data?.type, "CREDIT");
  assert.equal(data?.amount, 50000n);
  assert.equal(data?.reference, baseInput.reference);
});

test("debits available balance only when sufficient funds exist", async () => {
  const mocks = createTransactionMocks();

  await recordRiderWalletTransaction(mocks.tx, {
    ...baseInput,
    type: "DEBIT",
  });

  const args = mocks.getUpdateArgs();

  assert.equal(args?.where.availableBalance.gte, 50000n);
  assert.equal(args?.data.availableBalance.decrement, 50000n);
  assert.equal(args?.data.reservedBalance, undefined);
});

test("reserves funds by moving them from available to reserved balance", async () => {
  const mocks = createTransactionMocks();

  await recordRiderWalletTransaction(mocks.tx, {
    ...baseInput,
    type: "RESERVE",
  });

  const args = mocks.getUpdateArgs();

  assert.equal(args?.where.availableBalance.gte, 50000n);
  assert.equal(args?.data.availableBalance.decrement, 50000n);
  assert.equal(args?.data.reservedBalance.increment, 50000n);
});

test("releases reserved funds back to available balance", async () => {
  const mocks = createTransactionMocks();

  await recordRiderWalletTransaction(mocks.tx, {
    ...baseInput,
    type: "RELEASE",
  });

  const args = mocks.getUpdateArgs();

  assert.equal(args?.where.reservedBalance.gte, 50000n);
  assert.equal(args?.data.reservedBalance.decrement, 50000n);
  assert.equal(args?.data.availableBalance.increment, 50000n);
});

test("pays out reserved funds without increasing available balance", async () => {
  const mocks = createTransactionMocks();

  await recordRiderWalletTransaction(mocks.tx, {
    ...baseInput,
    type: "PAYOUT",
  });

  const args = mocks.getUpdateArgs();

  assert.equal(args?.where.reservedBalance.gte, 50000n);
  assert.equal(args?.data.reservedBalance.decrement, 50000n);
  assert.equal(args?.data.availableBalance, undefined);
});

test("reverses a payout by restoring available balance", async () => {
  const mocks = createTransactionMocks();

  await recordRiderWalletTransaction(mocks.tx, {
    ...baseInput,
    type: "REVERSAL",
  });

  const args = mocks.getUpdateArgs();

  assert.equal(args?.data.availableBalance.increment, 50000n);
});

test("rejects transactions when the wallet is missing or funds are insufficient", async () => {
  const mocks = createTransactionMocks(0);

  await assert.rejects(
    recordRiderWalletTransaction(mocks.tx, baseInput),
    { message: "WALLET_NOT_FOUND_OR_INSUFFICIENT_BALANCE" },
  );

  assert.equal(mocks.getCreateCalls(), 0);
});

test("rejects an empty wallet ID", async () => {
  const mocks = createTransactionMocks();

  await assert.rejects(
    recordRiderWalletTransaction(mocks.tx, {
      ...baseInput,
      walletId: " ",
    }),
    { message: "WALLET_ID_REQUIRED" },
  );

  assert.equal(mocks.getUpdateCalls(), 0);
});

test("rejects zero or negative transaction amounts", async () => {
  const mocks = createTransactionMocks();

  await assert.rejects(
    recordRiderWalletTransaction(mocks.tx, {
      ...baseInput,
      amount: 0n,
    }),
    { message: "INVALID_WALLET_TRANSACTION_AMOUNT" },
  );

  await assert.rejects(
    recordRiderWalletTransaction(mocks.tx, {
      ...baseInput,
      amount: -100n,
    }),
    { message: "INVALID_WALLET_TRANSACTION_AMOUNT" },
  );

  assert.equal(mocks.getUpdateCalls(), 0);
});

test("rejects an empty transaction reference", async () => {
  const mocks = createTransactionMocks();

  await assert.rejects(
    recordRiderWalletTransaction(mocks.tx, {
      ...baseInput,
      reference: " ",
    }),
    { message: "WALLET_TRANSACTION_REFERENCE_REQUIRED" },
  );

  assert.equal(mocks.getUpdateCalls(), 0);
});

test("trims references and descriptions and respects the supplied currency", async () => {
  const mocks = createTransactionMocks();

  await recordRiderWalletTransaction(mocks.tx, {
    ...baseInput,
    reference: "  custom-reference  ",
    description: "  Rider wallet credit  ",
    currency: "USD",
  });

  const args = mocks.getUpdateArgs();
  const data = mocks.getCreatedData();

  assert.equal(args?.where.currency, "USD");
  assert.equal(data?.reference, "custom-reference");
  assert.equal(data?.description, "Rider wallet credit");
  assert.equal(data?.currency, "USD");
});
