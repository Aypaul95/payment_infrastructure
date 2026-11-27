
import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const parsedDatabaseUrl = new URL(databaseUrl);

if (parsedDatabaseUrl.pathname !== "/payment_infrastructure_test") {
  throw new Error(
    "SAFETY CHECK FAILED: Vendor financial tests must use payment_infrastructure_test.",
  );
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

// Test-only encryption key. Never use this key outside the test process.
process.env.BANK_ACCOUNT_ENCRYPTION_KEY = "a".repeat(64);

const { prisma } = await import("../src/lib/prisma.ts");
const { vendorFinancialRouter } = await import(
  "../src/routes/vendor-financial.routes.ts"
);


const app = express();

app.use(express.json());
app.use("/vendor-financials", vendorFinancialRouter);

let server: ReturnType<typeof app.listen>;
const paystackApp = express();

const mockTransfers = new Map<
  string,
  {
    transfer_code: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
  }
>();

let paystackServer: ReturnType<typeof paystackApp.listen>;
let paystackBaseUrl!: string;
let baseUrl!: string;

paystackApp.use(express.json());

paystackApp.get("/bank/resolve", (req, res) => {
  res.json({
    status: true,
    data: {
      account_name: "Test Vendor",
      account_number: req.query.account_number,
    },
  });
});

paystackApp.post("/transferrecipient", (req, res) => {
  res.json({
    status: true,
    data: {
      recipient_code: `RCP_${randomUUID()}`,
      type: "nuban",
      name: "Test Vendor",
      details: {
        account_number: req.body.account_number,
        bank_code: req.body.bank_code,
      },
    },
  });
});

paystackApp.post("/transfer", (req, res) => {
  const transfer = {
    transfer_code: `TRF_${randomUUID()}`,
    reference: req.body.reference,
    amount: req.body.amount,
    currency: req.body.currency,
    status: "pending",
  };

  mockTransfers.set(transfer.reference, transfer);

  res.json({
    status: true,
    data: transfer,
  });
});

paystackApp.get("/transfer/verify/:reference", (req, res) => {
  const transfer = mockTransfers.get(req.params.reference);

  if (!transfer) {
    return res.status(404).json({
      status: false,
      message: "Transfer not found.",
    });
  }

  return res.json({
    status: true,
    data: transfer,
  });
});

function createBusinessToken(
  userId: string,
  businessAccountId: string,
  role: "OWNER" | "ADMIN" | "STAFF" = "OWNER",
) {
  return jwt.sign(
    { businessAccountId, role },
    JWT_SECRET!,
    {
      subject: userId,
      expiresIn: "15m",
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

async function request(
  path: string,
  token?: string,
  options: RequestInit = {},
) {
  return fetch(`${baseUrl}/vendor-financials${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}


const testBusinessIds: string[] = [];
const testUserIds: string[] = [];
const testBankAccountIds: string[] = [];

async function createTestBusiness(
  name: string,
  role: "OWNER" | "ADMIN" | "STAFF" = "OWNER",
) {
  const suffix = randomUUID();

  const business = await prisma.businessAccount.create({
    data: {
      businessName: name,
      email: `${suffix}@example.com`,
    },
  });

  testBusinessIds.push(business.id);

  const user = await prisma.businessUser.create({
    data: {
      businessAccountId: business.id,
      fullName: "Vendor Financial Test Owner",
      email: `owner-${suffix}@example.com`,
      passwordHash: "test-only-password-hash",
      role,
    },
  });

  testUserIds.push(user.id);

  return {
    businessAccountId: business.id,
    userId: user.id,
    token: createBusinessToken(user.id, business.id, role),
  };
}


async function createTestBankAccount(businessAccountId: string) {
  const account = await prisma.vendorBankAccount.create({
    data: {
      businessAccountId,
      bankCode: "058",
      bankName: "Test Bank",
      encryptedAccountNumber: "test-encrypted-account-number",
      maskedAccountNumber: "******1234",
      accountName: "Vendor Financial Test Account",
      recipientCode: `RCP_${randomUUID()}`,
      currency: "NGN",
      status: "VERIFIED",
      verifiedAt: new Date(),
      isDefault: true,
    },
  });

  testBankAccountIds.push(account.id);

  return account;
}


async function creditVendorBalance(
  businessAccountId: string,
  amount: bigint,
) {
  return prisma.vendorLedgerEntry.create({
    data: {
      businessAccountId,
      bucket: "AVAILABLE",
      direction: "CREDIT",
      type: "ORDER_CREDIT",
      amount,
      currency: "NGN",
      reference: `TEST-CREDIT-${randomUUID()}`,
      description: "Integration test opening balance",
    },
  });
}


before(async () => {
    paystackServer = paystackApp.listen(0, "127.0.0.1");

    await new Promise<void>((resolve, reject) => {
        paystackServer.once("listening", resolve);
        paystackServer.once("error", reject);
    });

    const paystackAddress = paystackServer.address();

    if (!paystackAddress || typeof paystackAddress === "string") {
        throw new Error("Unable to determine mock Paystack server address.");
    }

    paystackBaseUrl = `http://127.0.0.1:${paystackAddress.port}`;

    process.env.PAYSTACK_BASE_URL = paystackBaseUrl;
    process.env.PAYSTACK_SECRET_KEY = "test-paystack-secret-key";
  server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to determine test server address.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

    if (paystackServer) {
        await new Promise<void>((resolve, reject) => {
            paystackServer.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

  if (testBusinessIds.length > 0) {
    await prisma.vendorLedgerEntry.deleteMany({
      where: { businessAccountId: { in: testBusinessIds } },
    });

    await prisma.vendorSettlement.deleteMany({
      where: { businessAccountId: { in: testBusinessIds } },
    });

    await prisma.vendorBankAccount.deleteMany({
      where: { businessAccountId: { in: testBusinessIds } },
    });

    await prisma.businessUser.deleteMany({
      where: { id: { in: testUserIds } },
    });

    await prisma.businessAccount.deleteMany({
      where: { id: { in: testBusinessIds } },
    });
  }

  await prisma.$disconnect();
});

test("vendor financial routes are restricted to business owners", async () => {
  const owner = await createTestBusiness("Vendor Financial Owner", "OWNER");
  const admin = await createTestBusiness("Vendor Financial Admin", "ADMIN");
  const staff = await createTestBusiness("Vendor Financial Staff", "STAFF");

  const ownerResponse = await request("/bank-accounts", owner.token);
  assert.equal(ownerResponse.status, 200);

  const adminResponse = await request("/bank-accounts", admin.token);
  assert.equal(adminResponse.status, 403);

  const staffResponse = await request("/bank-accounts", staff.token);
  assert.equal(staffResponse.status, 403);

  const unauthenticatedResponse = await request("/bank-accounts");
  assert.equal(unauthenticatedResponse.status, 401);
});

test("settlement creation rejects invalid request data", async () => {
  const owner = await createTestBusiness("Invalid Settlement Test");

  const response = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: "",
      amount: "0",
      idempotencyKey: "",
    }),
  });

  assert.equal(response.status, 400);
});

test("vendor can register a bank account through the Paystack mock", async () => {
  const owner = await createTestBusiness("Bank Registration Test");

  const response = await request("/bank-accounts", owner.token, {
    method: "POST",
    body: JSON.stringify({
      accountNumber: "0123456789",
      bankCode: "058",
      bankName: "Test Bank",
      setAsDefault: true,
    }),
  });

  assert.equal(response.status, 201);

  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.data.maskedAccountNumber, "******6789");
  assert.equal(body.data.status, "VERIFIED");
  assert.equal(JSON.stringify(body).includes("0123456789"), false);
});

test("vendor can create a settlement with sufficient available balance", async () => {
  const owner = await createTestBusiness("Settlement Creation Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const response = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `SETTLEMENT-${randomUUID()}`,
    }),
  });

  assert.equal(response.status, 201);

  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.data.status, "PENDING");
  assert.equal(body.data.amount, "25000");
});

test("repeated settlement requests with the same idempotency key return the existing settlement", async () => {
  const owner = await createTestBusiness("Settlement Idempotency Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const idempotencyKey = `IDEMPOTENCY-${randomUUID()}`;

  const payload = {
    bankAccountId: bankAccount.id,
    amount: "25000",
    idempotencyKey,
  };

  const firstResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  assert.equal(firstResponse.status, 201);

  const firstBody = await firstResponse.json();

  const secondResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  assert.equal(secondResponse.status, 201);

  const secondBody = await secondResponse.json();

  assert.equal(secondBody.data.id, firstBody.data.id);

  const settlementCount = await prisma.vendorSettlement.count({
    where: {
      businessAccountId: owner.businessAccountId,
      idempotencyKey,
    },
  });

  assert.equal(settlementCount, 1);
});

test("settlement rejects an idempotency key reused with a different request", async () => {
  const owner = await createTestBusiness("Settlement Key Conflict Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const idempotencyKey = `CONFLICT-${randomUUID()}`;

  const firstResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "20000",
      idempotencyKey,
    }),
  });

  assert.equal(firstResponse.status, 201);

  const secondResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "30000",
      idempotencyKey,
    }),
  });

  assert.equal(secondResponse.status, 409);

  const body = await secondResponse.json();

  assert.equal(
    body.code,
    "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST",
  );
});

test("settlement rejects amounts exceeding available vendor balance", async () => {
  const owner = await createTestBusiness("Insufficient Balance Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 10_000n);

  const response = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `INSUFFICIENT-${randomUUID()}`,
    }),
  });

  assert.equal(response.status, 409);

  const body = await response.json();

  assert.equal(body.code, "INSUFFICIENT_VENDOR_BALANCE");

  const settlementCount = await prisma.vendorSettlement.count({
    where: { businessAccountId: owner.businessAccountId },
  });

  assert.equal(settlementCount, 0);
});

test("vendor cannot create a settlement using another business's bank account", async () => {
  const ownerA = await createTestBusiness("Bank Account Owner A");
  const ownerB = await createTestBusiness("Bank Account Owner B");

  const bankAccountB = await createTestBankAccount(
    ownerB.businessAccountId,
  );

  await creditVendorBalance(ownerA.businessAccountId, 50_000n);

  const response = await request("/settlements", ownerA.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccountB.id,
      amount: "25000",
      idempotencyKey: `CROSS-BUSINESS-${randomUUID()}`,
    }),
  });

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.code, "VERIFIED_VENDOR_BANK_ACCOUNT_NOT_FOUND");

  const settlementCount = await prisma.vendorSettlement.count({
    where: { businessAccountId: ownerA.businessAccountId },
  });

  assert.equal(settlementCount, 0);
});

test("bank account listing exposes only safe account details", async () => {
  const owner = await createTestBusiness("Bank Account Listing Test");

  await createTestBankAccount(owner.businessAccountId);

  const response = await request("/bank-accounts", owner.token);

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.count, 1);
  assert.equal(body.data.length, 1);

  const account = body.data[0];

  assert.equal(account.maskedAccountNumber, "******1234");
  assert.equal(account.status, "VERIFIED");

  assert.equal("encryptedAccountNumber" in account, false);
  assert.equal("recipientCode" in account, false);
});

test("vendor settlement listing is scoped to the authenticated business", async () => {
  const ownerA = await createTestBusiness("Settlement Listing Owner A");
  const ownerB = await createTestBusiness("Settlement Listing Owner B");

  const bankAccountA = await createTestBankAccount(
    ownerA.businessAccountId,
  );
  const bankAccountB = await createTestBankAccount(
    ownerB.businessAccountId,
  );

  await creditVendorBalance(ownerA.businessAccountId, 50_000n);
  await creditVendorBalance(ownerB.businessAccountId, 50_000n);

  for (const [owner, bankAccount] of [
    [ownerA, bankAccountA],
    [ownerB, bankAccountB],
  ] as const) {
    const createResponse = await request("/settlements", owner.token, {
      method: "POST",
      body: JSON.stringify({
        bankAccountId: bankAccount.id,
        amount: "25000",
        idempotencyKey: `LIST-${randomUUID()}`,
      }),
    });

    assert.equal(createResponse.status, 201);
  }

  const response = await request("/settlements", ownerA.token);

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.count, 1);
  assert.equal(body.data.length, 1);
  assert.equal(
    body.data[0].businessAccountId,
    undefined,
  );
});

test("vendor can set their verified bank account as the default", async () => {
  const owner = await createTestBusiness("Default Bank Account Test");

  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

    const response = await request(
        `/bank-accounts/${bankAccount.id}/default`,
        owner.token,
        {
            method: "PATCH",
        },
    );

  assert.equal(response.status, 200);

  const updatedAccount = await prisma.vendorBankAccount.findUnique({
    where: { id: bankAccount.id },
  });

  assert.equal(updatedAccount?.isDefault, true);
});

test("vendor cannot set another business's bank account as default", async () => {
  const ownerA = await createTestBusiness("Default Account Owner A");
  const ownerB = await createTestBusiness("Default Account Owner B");

  const bankAccountB = await createTestBankAccount(
    ownerB.businessAccountId,
  );

  const response = await request(
    `/bank-accounts/${bankAccountB.id}/default`,
    ownerA.token,
    { method: "PATCH" },
  );

  assert.equal(response.status, 404);

  const account = await prisma.vendorBankAccount.findUnique({
    where: { id: bankAccountB.id },
  });

  assert.equal(account?.isDefault, true);
});

test("vendor can initiate a pending settlement through Paystack", async () => {
  const owner = await createTestBusiness("Settlement Initiation Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `INITIATE-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const createBody = await createResponse.json();
  const settlementId = createBody.data.id;

  const initiateResponse = await request(
    `/settlements/${settlementId}/initiate`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(initiateResponse.status, 200);

  const settlement = await prisma.vendorSettlement.findUnique({
    where: { id: settlementId },
  });

  assert.equal(settlement?.status, "PROCESSING");
  assert.ok(settlement?.paystackTransferCode);
});

test("successful Paystack verification completes vendor settlement", async () => {
  const owner = await createTestBusiness("Settlement Verification Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `VERIFY-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const initiateResponse = await request(
    `/settlements/${settlementId}/initiate`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(initiateResponse.status, 200);

  const settlementBeforeVerification =
    await prisma.vendorSettlement.findUnique({
      where: { id: settlementId },
    });

  assert.ok(settlementBeforeVerification);

  const transfer = mockTransfers.get(
    settlementBeforeVerification.reference,
  );

  assert.ok(transfer);

  mockTransfers.set(settlementBeforeVerification.reference, {
    ...transfer,
    status: "success",
  });

  const verifyResponse = await request(
    `/settlements/${settlementId}/verify`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(verifyResponse.status, 200);

  const settlementAfterVerification =
    await prisma.vendorSettlement.findUnique({
      where: { id: settlementId },
    });

  assert.equal(settlementAfterVerification?.status, "SUCCESSFUL");

  const payoutEntries = await prisma.vendorLedgerEntry.count({
    where: {
      settlementId,
      type: "SETTLEMENT_PAYOUT",
    },
  });

  assert.equal(payoutEntries, 1);
});

test("failed Paystack verification releases reserved vendor funds", async () => {
  const owner = await createTestBusiness("Failed Settlement Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `FAILED-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const initiateResponse = await request(
    `/settlements/${settlementId}/initiate`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(initiateResponse.status, 200);

  const settlement = await prisma.vendorSettlement.findUnique({
    where: { id: settlementId },
  });

  assert.ok(settlement);

  const transfer = mockTransfers.get(settlement.reference);
  assert.ok(transfer);

  mockTransfers.set(settlement.reference, {
    ...transfer,
    status: "failed",
  });

  const verifyResponse = await request(
    `/settlements/${settlementId}/verify`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(verifyResponse.status, 200);

  const updatedSettlement = await prisma.vendorSettlement.findUnique({
    where: { id: settlementId },
  });

  assert.equal(updatedSettlement?.status, "FAILED");

  const balance = await prisma.vendorLedgerEntry.groupBy({
    by: ["bucket", "direction"],
    where: { businessAccountId: owner.businessAccountId },
    _sum: { amount: true },
  });

  const available = balance
    .filter((entry) => entry.bucket === "AVAILABLE")
    .reduce(
      (total, entry) =>
        total +
        (entry.direction === "CREDIT"
          ? (entry._sum.amount ?? 0n)
          : -(entry._sum.amount ?? 0n)),
      0n,
    );

  const reserved = balance
    .filter((entry) => entry.bucket === "RESERVED")
    .reduce(
      (total, entry) =>
        total +
        (entry.direction === "CREDIT"
          ? (entry._sum.amount ?? 0n)
          : -(entry._sum.amount ?? 0n)),
      0n,
    );

  assert.equal(available, 50_000n);
  assert.equal(reserved, 0n);
});

test("repeated successful verification does not duplicate payout ledger entries", async () => {
  const owner = await createTestBusiness("Repeated Verification Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `REPEAT-VERIFY-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const initiateResponse = await request(
    `/settlements/${settlementId}/initiate`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(initiateResponse.status, 200);

  const settlement = await prisma.vendorSettlement.findUniqueOrThrow({
    where: { id: settlementId },
  });

  const transfer = mockTransfers.get(settlement.reference);
  assert.ok(transfer);

  mockTransfers.set(settlement.reference, {
    ...transfer,
    status: "success",
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await request(
      `/settlements/${settlementId}/verify`,
      owner.token,
      { method: "POST" },
    );

    assert.equal(response.status, 200);
  }

  const payoutCount = await prisma.vendorLedgerEntry.count({
    where: {
      settlementId,
      type: "SETTLEMENT_PAYOUT",
    },
  });

  assert.equal(payoutCount, 1);
});

test("reversed pending transfer releases reserved vendor funds", async () => {
  const owner = await createTestBusiness("Pending Reversal Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `PENDING-REVERSAL-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const initiateResponse = await request(
    `/settlements/${settlementId}/initiate`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(initiateResponse.status, 200);

  const settlement = await prisma.vendorSettlement.findUniqueOrThrow({
    where: { id: settlementId },
  });

  const transfer = mockTransfers.get(settlement.reference);
  assert.ok(transfer);

  mockTransfers.set(settlement.reference, {
    ...transfer,
    status: "reversed",
  });

  const verifyResponse = await request(
    `/settlements/${settlementId}/verify`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(verifyResponse.status, 200);

  const updatedSettlement = await prisma.vendorSettlement.findUnique({
    where: { id: settlementId },
  });

  assert.equal(updatedSettlement?.status, "REVERSED");

  const entries = await prisma.vendorLedgerEntry.findMany({
    where: { businessAccountId: owner.businessAccountId },
  });

  const available = entries
    .filter((entry) => entry.bucket === "AVAILABLE")
    .reduce(
      (total, entry) =>
        total +
        (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0n,
    );

  const reserved = entries
    .filter((entry) => entry.bucket === "RESERVED")
    .reduce(
      (total, entry) =>
        total +
        (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0n,
    );

  assert.equal(available, 50_000n);
  assert.equal(reserved, 0n);
});

test("reversal after successful payout restores vendor available balance", async () => {
  const owner = await createTestBusiness("Successful Payout Reversal Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `SUCCESS-REVERSAL-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const initiateResponse = await request(
    `/settlements/${settlementId}/initiate`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(initiateResponse.status, 200);

  const settlement = await prisma.vendorSettlement.findUniqueOrThrow({
    where: { id: settlementId },
  });

  const transfer = mockTransfers.get(settlement.reference);
  assert.ok(transfer);

  mockTransfers.set(settlement.reference, {
    ...transfer,
    status: "success",
  });

  const firstVerification = await request(
    `/settlements/${settlementId}/verify`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(firstVerification.status, 200);

  mockTransfers.set(settlement.reference, {
    ...transfer,
    status: "reversed",
  });

  const reversalVerification = await request(
    `/settlements/${settlementId}/verify`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(reversalVerification.status, 200);

  const updatedSettlement = await prisma.vendorSettlement.findUnique({
    where: { id: settlementId },
  });

  assert.equal(updatedSettlement?.status, "REVERSED");

  const entries = await prisma.vendorLedgerEntry.findMany({
    where: { businessAccountId: owner.businessAccountId },
  });

  const available = entries
    .filter((entry) => entry.bucket === "AVAILABLE")
    .reduce(
      (total, entry) =>
        total +
        (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0n,
    );

  const reserved = entries
    .filter((entry) => entry.bucket === "RESERVED")
    .reduce(
      (total, entry) =>
        total +
        (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0n,
    );

  assert.equal(available, 50_000n);
  assert.equal(reserved, 0n);

  const reversalCount = await prisma.vendorLedgerEntry.count({
    where: {
      settlementId,
      type: "REVERSAL",
    },
  });

  assert.equal(reversalCount, 1);
});

test("pending Paystack transfer remains processing until confirmed", async () => {
  const owner = await createTestBusiness("Pending Transfer Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `PENDING-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const initiateResponse = await request(
    `/settlements/${settlementId}/initiate`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(initiateResponse.status, 200);

  const verifyResponse = await request(
    `/settlements/${settlementId}/verify`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(verifyResponse.status, 200);

  const verifyBody = await verifyResponse.json();

  assert.equal(verifyBody.data.status, "PROCESSING");

  const settlement = await prisma.vendorSettlement.findUnique({
    where: { id: settlementId },
  });

  assert.equal(settlement?.status, "PROCESSING");

  const payoutCount = await prisma.vendorLedgerEntry.count({
    where: {
      settlementId,
      type: "SETTLEMENT_PAYOUT",
    },
  });

  assert.equal(payoutCount, 0);
});

test("vendor cannot verify another business settlement", async () => {
  const ownerA = await createTestBusiness("Settlement Verify Owner A");
  const ownerB = await createTestBusiness("Settlement Verify Owner B");

  const bankAccount = await createTestBankAccount(
    ownerB.businessAccountId,
  );

  await creditVendorBalance(ownerB.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", ownerB.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `CROSS-VERIFY-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const verifyResponse = await request(
    `/settlements/${settlementId}/verify`,
    ownerA.token,
    { method: "POST" },
  );

  assert.equal(verifyResponse.status, 404);
});

test("cannot verify a settlement that has not been initiated", async () => {
  const owner = await createTestBusiness("Uninitiated Settlement Test");
  const bankAccount = await createTestBankAccount(
    owner.businessAccountId,
  );

  await creditVendorBalance(owner.businessAccountId, 50_000n);

  const createResponse = await request("/settlements", owner.token, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId: bankAccount.id,
      amount: "25000",
      idempotencyKey: `UNINITIATED-${randomUUID()}`,
    }),
  });

  assert.equal(createResponse.status, 201);

  const settlementId = (await createResponse.json()).data.id;

  const verifyResponse = await request(
    `/settlements/${settlementId}/verify`,
    owner.token,
    { method: "POST" },
  );

  assert.equal(verifyResponse.status, 409);
});