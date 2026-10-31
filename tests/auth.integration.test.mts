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
    "SAFETY CHECK FAILED: Authentication tests must use payment_infrastructure_test.",
  );
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma.ts");
const { authenticate } = await import("../src/middleware/auth.middleware.ts");

const app = express();

app.use(express.json());

app.get("/protected", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    auth: req.auth,
  });
});

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

let businessAccountId: string;
let businessUserId: string;

let secondBusinessAccountId: string;
let secondBusinessUserId: string;

function createToken(userId: string, accountId: string): string {
  return jwt.sign(
    {
      businessAccountId: accountId,
      role: "OWNER",
    },
    JWT_SECRET!,
    {
      subject: userId,
      expiresIn: "15m",
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

async function requestProtectedRoute(token: string) {
  return fetch(`${baseUrl}/protected`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

before(async () => {
  const business = await prisma.businessAccount.create({
    data: {
      businessName: "Auth Integration Test Business",
      email: `auth-business-${randomUUID()}@example.com`,
    },
  });

  businessAccountId = business.id;

  const user = await prisma.businessUser.create({
    data: {
      businessAccountId,
      fullName: "Auth Test User",
      email: `auth-user-${randomUUID()}@example.com`,
      passwordHash: "test-only-password-hash",
      role: "OWNER",
    },
  });

  businessUserId = user.id;

  const secondBusiness = await prisma.businessAccount.create({
    data: {
      businessName: "Inactive Business Test",
      email: `auth-inactive-business-${randomUUID()}@example.com`,
    },
  });

  secondBusinessAccountId = secondBusiness.id;

  const secondUser = await prisma.businessUser.create({
    data: {
      businessAccountId: secondBusinessAccountId,
      fullName: "Inactive Business Test User",
      email: `auth-inactive-user-${randomUUID()}@example.com`,
      passwordHash: "test-only-password-hash",
      role: "OWNER",
    },
  });

  secondBusinessUserId = secondUser.id;

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

  if (businessAccountId) {
    await prisma.businessUser.deleteMany({
      where: { businessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: businessAccountId },
    });
  }

  if (secondBusinessAccountId) {
    await prisma.businessUser.deleteMany({
      where: { businessAccountId: secondBusinessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: secondBusinessAccountId },
    });
  }

  await prisma.$disconnect();
});

test("allows an active user belonging to an active business", async () => {
  const token = createToken(businessUserId, businessAccountId);

  const response = await requestProtectedRoute(token);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.auth.userId, businessUserId);
  assert.equal(body.auth.businessAccountId, businessAccountId);
  assert.equal(body.auth.role, "OWNER");
});

test("rejects a deactivated user", async () => {
  await prisma.businessUser.update({
    where: { id: businessUserId },
    data: { isActive: false },
  });

  const token = createToken(businessUserId, businessAccountId);

  const response = await requestProtectedRoute(token);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Account is inactive or no longer available.",
  );
});

test("rejects a user belonging to a deactivated business", async () => {
  await prisma.businessAccount.update({
    where: { id: secondBusinessAccountId },
    data: { isActive: false },
  });

  const token = createToken(secondBusinessUserId, secondBusinessAccountId);

  const response = await requestProtectedRoute(token);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Account is inactive or no longer available.",
  );
});

test("uses the user's current database role instead of the JWT role", async () => {
  await prisma.businessUser.update({
    where: { id: businessUserId },
    data: {
      isActive: true,
      role: "ADMIN",
    },
  });

  const token = createToken(businessUserId, businessAccountId);

  const response = await requestProtectedRoute(token);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.auth.role, "ADMIN");
});