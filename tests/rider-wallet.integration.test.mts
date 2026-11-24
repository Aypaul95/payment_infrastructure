
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
    "SAFETY CHECK FAILED: Wallet tests must use payment_infrastructure_test.",
  );
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma.ts");
const { riderRouter } = await import("../src/routes/rider.routes.ts");

const app = express();
app.use(express.json());
app.use("/riders", riderRouter);

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

let approvedRiderId: string;
let pendingRiderId: string;
let inactiveRiderId: string;

function createRiderToken(riderId: string) {
  return jwt.sign(
    { accountType: "RIDER" },
    JWT_SECRET!,
    {
      subject: riderId,
      expiresIn: "15m",
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

async function createTestRider(input: {
  approvalStatus: "APPROVED" | "PENDING";
  isActive?: boolean;
}) {
  return prisma.rider.create({
    data: {
      fullName: "Wallet Integration Test Rider",
      phone: `080${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 10)}`,
      passwordHash: "test-only-password-hash",
      approvalStatus: input.approvalStatus,
      isActive: input.isActive ?? true,
    },
  });
}

async function requestWallet(token: string) {
  return fetch(`${baseUrl}/riders/wallet`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

before(async () => {
  const approvedRider = await createTestRider({
    approvalStatus: "APPROVED",
  });

  approvedRiderId = approvedRider.id;

  const pendingRider = await createTestRider({
    approvalStatus: "PENDING",
  });

  pendingRiderId = pendingRider.id;

  const inactiveRider = await createTestRider({
    approvalStatus: "APPROVED",
    isActive: false,
  });

  inactiveRiderId = inactiveRider.id;

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

  const riderIds = [
    approvedRiderId,
    pendingRiderId,
    inactiveRiderId,
  ].filter(Boolean);

  if (riderIds.length > 0) {
    await prisma.riderWalletTransaction.deleteMany({
      where: {
        wallet: {
          riderId: { in: riderIds },
        },
      },
    });

    await prisma.riderWallet.deleteMany({
      where: {
        riderId: { in: riderIds },
      },
    });

    await prisma.rider.deleteMany({
      where: {
        id: { in: riderIds },
      },
    });
  }

  await prisma.$disconnect();
});

test("creates a wallet for an approved active rider", async () => {
  const response = await requestWallet(
    createRiderToken(approvedRiderId),
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.riderId, approvedRiderId);
  assert.equal(body.data.availableBalance, "0");
  assert.equal(body.data.reservedBalance, "0");
  assert.equal(body.data.currency, "NGN");
});

test("returns the existing wallet without creating a duplicate", async () => {
  const firstResponse = await requestWallet(
    createRiderToken(approvedRiderId),
  );

  const firstBody = await firstResponse.json();

  const secondResponse = await requestWallet(
    createRiderToken(approvedRiderId),
  );

  const secondBody = await secondResponse.json();

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(firstBody.data.id, secondBody.data.id);

  const walletCount = await prisma.riderWallet.count({
    where: { riderId: approvedRiderId },
  });

  assert.equal(walletCount, 1);
});

test("rejects wallet access for a pending rider", async () => {
  const response = await requestWallet(
    createRiderToken(pendingRiderId),
  );

  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.success, false);

  const walletCount = await prisma.riderWallet.count({
    where: { riderId: pendingRiderId },
  });

  assert.equal(walletCount, 0);
});

test("rejects wallet access for an inactive rider", async () => {
  const response = await requestWallet(
    createRiderToken(inactiveRiderId),
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);

  const walletCount = await prisma.riderWallet.count({
    where: { riderId: inactiveRiderId },
  });

  assert.equal(walletCount, 0);
});

test("rejects wallet access without an authentication token", async () => {
  const response = await fetch(`${baseUrl}/riders/wallet`);

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});
