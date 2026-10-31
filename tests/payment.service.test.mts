
import { test } from "node:test";
import assert from "node:assert/strict";

import { isSamePaymentRequest } from "../src/services/payment-idempotency.ts";

const existingPayment = {
  customerId: null,
  amount: 5000n,
  currency: "NGN",
  description: "Test payment",
};

const originalRequest = {
  customerId: null,
  amount: 5000n,
  currency: "NGN",
  description: "Test payment",
};

test("accepts the same payment request", () => {
  assert.equal(
    isSamePaymentRequest(existingPayment, originalRequest),
    true,
  );
});

test("rejects a different payment amount", () => {
  assert.equal(
    isSamePaymentRequest(existingPayment, {
      ...originalRequest,
      amount: 6000n,
    }),
    false,
  );
});

test("rejects a different currency", () => {
  assert.equal(
    isSamePaymentRequest(existingPayment, {
      ...originalRequest,
      currency: "USD",
    }),
    false,
  );
});

test("rejects a different customer", () => {
  assert.equal(
    isSamePaymentRequest(existingPayment, {
      ...originalRequest,
      customerId: "customer-123",
    }),
    false,
  );
});

test("rejects a different description", () => {
  assert.equal(
    isSamePaymentRequest(existingPayment, {
      ...originalRequest,
      description: "Another payment",
    }),
    false,
  );
});