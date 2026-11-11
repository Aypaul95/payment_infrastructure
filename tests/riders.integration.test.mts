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
    "SAFETY CHECK FAILED: Rider tests must use payment_infrastructure_test.",
  );
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma.ts");
const { riderRouter } = await import("../src/routes/rider.routes.ts");
const { authenticateRider } = await import(
  "../src/middleware/rider-auth.middleware.ts"
);
const { authenticate } = await import(
  "../src/middleware/auth.middleware.ts"
);
const { deleteKycDocument } = await import(
  "../src/services/rider-kyc-storage.service.ts"
);

const app = express();

app.use(express.json());
app.use("/riders", riderRouter);

app.get("/rider-protected", authenticateRider, (req, res) => {
  res.status(200).json({
    success: true,
    auth: req.riderAuth,
  });
});

app.get("/business-protected", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    auth: req.auth,
  });
});

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

let riderId: string;
let riderPhone: string;
let riderEmail: string;
let otherRiderId: string | undefined;
let riderVehicleId: string | undefined;
let riderVehicleRegistrationNumber: string;

let businessAccountId: string;
let businessUserId: string;

let riderToken: string;
let businessToken: string;
let riderKycStorageKeys: string[] = [];

function createRiderToken(id: string): string {
  return jwt.sign(
    {
      accountType: "RIDER",
    },
    JWT_SECRET!,
    {
      subject: id,
      expiresIn: "15m",
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

function createBusinessToken(
  userId: string,
  accountId: string,
): string {
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

async function request(
  path: string,
  options: RequestInit = {},
) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
    },
  });
}

async function requestWithToken(
  path: string,
  token: string,
  options: RequestInit = {},
) {
  return request(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

before(async () => {
  const business = await prisma.businessAccount.create({
    data: {
      businessName: "Rider Auth Integration Test Business",
      email: `rider-business-${randomUUID()}@example.com`,
    },
  });

  businessAccountId = business.id;

  const user = await prisma.businessUser.create({
    data: {
      businessAccountId,
      fullName: "Rider Test Business Owner",
      email: `rider-business-owner-${randomUUID()}@example.com`,
      passwordHash: "test-only-password-hash",
      role: "OWNER",
    },
  });

  businessUserId = user.id;
  businessToken = createBusinessToken(user.id, business.id);

  riderPhone = `080${String(Date.now()).slice(-8)}`;
  riderEmail = `rider-${randomUUID()}@example.com`;

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

  const testRiderIds = [riderId, otherRiderId].filter(
    (id): id is string => Boolean(id),
  );

  if (testRiderIds.length > 0) {
    const kycSubmissions = await prisma.riderKycSubmission.findMany({
      where: {
        riderId: { in: testRiderIds },
      },
      select: {
        id: true,
        documentStorageKey: true,
      },
    });

    await prisma.riderKycReview.deleteMany({
      where: {
        submissionId: {
          in: kycSubmissions.map((submission) => submission.id),
        },
      },
    });

    await prisma.riderKycSubmission.deleteMany({
      where: {
        id: {
          in: kycSubmissions.map((submission) => submission.id),
        },
      },
    });

    for (const submission of kycSubmissions) {
      await deleteKycDocument(submission.documentStorageKey);
    }

    for (const storageKey of riderKycStorageKeys) {
      await deleteKycDocument(storageKey);
    }

    await prisma.riderVehicle.deleteMany({
      where: {
        riderId: { in: testRiderIds },
      },
    });

    await prisma.rider.deleteMany({
      where: {
        id: { in: testRiderIds },
      },
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

  await prisma.$disconnect();
});

test("registers a rider with pending approval and normalized phone number", async () => {
  const response = await request("/riders/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: "Integration Test Rider",
      phone: riderPhone,
      email: riderEmail,
      password: "integration-test-password",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.rider.fullName, "Integration Test Rider");
  assert.equal(body.data.rider.phone, `+234${riderPhone.slice(1)}`);
  assert.equal(body.data.rider.email, riderEmail);
  assert.equal(body.data.rider.approvalStatus, "PENDING");
  assert.equal(body.data.rider.isActive, true);
  assert.equal(body.data.tokenType, "Bearer");
  assert.equal(body.data.expiresIn, 900);
  assert.equal(typeof body.data.accessToken, "string");
  assert.equal("passwordHash" in body.data.rider, false);

  riderId = body.data.rider.id;
  riderToken = body.data.accessToken;
});

test("rejects duplicate rider registration", async () => {
  const response = await request("/riders/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: "Duplicate Test Rider",
      phone: riderPhone,
      email: `duplicate-${randomUUID()}@example.com`,
      password: "integration-test-password",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
});

test("rejects invalid rider registration data", async () => {
  const response = await request("/riders/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: "A",
      phone: "invalid-phone",
      email: "not-an-email",
      password: "short",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(Array.isArray(body.errors), true);
});

test("allows a rider to log in with normalized Nigerian phone number", async () => {
  const response = await request("/riders/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: `+234${riderPhone.slice(1)}`,
      password: "integration-test-password",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.rider.id, riderId);
  assert.equal(body.data.rider.approvalStatus, "PENDING");
  assert.equal(typeof body.data.accessToken, "string");
});

test("rejects incorrect rider login credentials", async () => {
  const response = await request("/riders/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: riderPhone,
      password: "incorrect-password",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.message, "Invalid phone number or password.");
});

test("allows a pending rider to access their profile", async () => {
  const response = await requestWithToken("/riders/me", riderToken);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, riderId);
  assert.equal(body.data.approvalStatus, "PENDING");
  assert.equal("passwordHash" in body.data, false);
});

test("allows a valid rider token through rider authentication", async () => {
  const response = await requestWithToken(
    "/rider-protected",
    riderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.auth.riderId, riderId);
});

test("rejects a rider token on business authentication routes", async () => {
  const response = await requestWithToken(
    "/business-protected",
    riderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});

test("rejects a business token on rider authentication routes", async () => {
  const response = await requestWithToken(
    "/rider-protected",
    businessToken,
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});

test("rejects requests without a rider authentication token", async () => {
  const response = await request("/rider-protected");
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.message, "Authentication token is required.");
});


test("registers a vehicle for the authenticated rider", async () => {
  const response = await request("/riders/vehicles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${riderToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vehicleType: "MOTORCYCLE",
      make: "Honda",
      model: "CG 125",
      color: "Black",
      registrationNumber: `LAG-${randomUUID().slice(0, 8)}`,
      year: 2022,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.riderId, riderId);
  assert.equal(body.data.vehicleType, "MOTORCYCLE");
  assert.equal(body.data.make, "Honda");
  assert.equal(body.data.model, "CG 125");
  assert.equal(body.data.color, "Black");
  assert.equal(body.data.year, 2022);
  assert.equal(body.data.isActive, true);
  riderVehicleId = body.data.id;
  riderVehicleRegistrationNumber = body.data.registrationNumber;
});

test("rejects a vehicle with an already registered number", async () => {
  const response = await request("/riders/vehicles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${riderToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vehicleType: "CAR",
      make: "Toyota",
      model: "Corolla",
      registrationNumber: riderVehicleRegistrationNumber,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "A vehicle with this registration number already exists.",
  );
});

test("rejects vehicle registration without rider authentication", async () => {
  const response = await request("/riders/vehicles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vehicleType: "MOTORCYCLE",
    }),
  });

  assert.equal(response.status, 401);
});

test("rejects invalid vehicle registration data", async () => {
  const response = await request("/riders/vehicles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${riderToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vehicleType: "AIRPLANE",
      year: 1700,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(Array.isArray(body.errors), true);
});


test("lists vehicles belonging to the authenticated rider", async () => {
  const response = await requestWithToken(
    "/riders/vehicles",
    riderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(Array.isArray(body.data), true);
  assert.equal(
    body.data.some(
      (vehicle: { id: string }) => vehicle.id === riderVehicleId,
    ),
    true,
  );
});

test("retrieves a vehicle belonging to the authenticated rider", async () => {
  const response = await requestWithToken(
    `/riders/vehicles/${riderVehicleId}`,
    riderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, riderVehicleId);
  assert.equal(body.data.riderId, riderId);
});

test("updates a vehicle belonging to the authenticated rider", async () => {
  const response = await requestWithToken(
    `/riders/vehicles/${riderVehicleId}`,
    riderToken,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        color: "Red",
        year: 2023,
      }),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, riderVehicleId);
  assert.equal(body.data.color, "Red");
  assert.equal(body.data.year, 2023);
});

test("rejects an empty vehicle update", async () => {
  const response = await requestWithToken(
    `/riders/vehicles/${riderVehicleId}`,
    riderToken,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("returns 404 when a rider requests a nonexistent vehicle", async () => {
  const response = await requestWithToken(
    `/riders/vehicles/${randomUUID()}`,
    riderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

test("prevents a rider from accessing another rider's vehicle", async () => {
  const otherRider = await prisma.rider.create({
    data: {
      fullName: "Second Integration Test Rider",
      phone: `+23480${String(Date.now()).slice(-8)}`,
      passwordHash: "test-only-password-hash",
    },
  });

  otherRiderId = otherRider.id;

  const otherRiderToken = createRiderToken(otherRider.id);

  const response = await requestWithToken(
    `/riders/vehicles/${riderVehicleId}`,
    otherRiderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

test("prevents a rider from updating another rider's vehicle", async () => {
  const otherRiderToken = createRiderToken(otherRiderId!);

  const response = await requestWithToken(
    `/riders/vehicles/${riderVehicleId}`,
    otherRiderToken,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        color: "Blue",
      }),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

test("deactivates a vehicle belonging to the authenticated rider", async () => {
  const response = await requestWithToken(
    `/riders/vehicles/${riderVehicleId}/deactivate`,
    riderToken,
    {
      method: "PATCH",
    },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, riderVehicleId);
  assert.equal(body.data.isActive, false);
});

test("rejects updating an already deactivated vehicle", async () => {
  const response = await requestWithToken(
    `/riders/vehicles/${riderVehicleId}`,
    riderToken,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        color: "Blue",
      }),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

test("rejects KYC submission without rider authentication", async () => {
  const form = new FormData();
  form.append("documentType", "NIN");

  const response = await request("/riders/kyc/submissions", {
    method: "POST",
    body: form,
  });

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});

test("rejects KYC submission when no document is uploaded", async () => {
  const form = new FormData();
  form.append("documentType", "NIN");

  const response = await requestWithToken(
    "/riders/kyc/submissions",
    riderToken,
    {
      method: "POST",
      body: form,
    },
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("accepts a valid KYC document and returns safe metadata", async () => {
  const pdfBuffer = Buffer.from(
    "%PDF-1.4\nSynthetic KYC integration test document\n%%EOF",
  );

  const form = new FormData();
  form.append("documentType", "NIN");
  form.append(
    "document",
    new Blob([pdfBuffer], { type: "application/pdf" }),
    "synthetic.pdf",
  );

  const response = await requestWithToken(
    "/riders/kyc/submissions",
    riderToken,
    {
      method: "POST",
      body: form,
    },
  );

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.documentType, "NIN");
  assert.equal(body.data.status, "PENDING");
  assert.equal("documentStorageKey" in body.data, false);

  const submission = await prisma.riderKycSubmission.findUnique({
    where: { id: body.data.id },
    select: { documentStorageKey: true },
  });

  assert.ok(submission);
  riderKycStorageKeys.push(submission.documentStorageKey);
});

test("lists KYC submissions without exposing private storage keys", async () => {
  const response = await requestWithToken(
    "/riders/kyc/submissions",
    riderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length >= 1);

  const submission = body.data.find(
    (item: { documentType: string }) => item.documentType === "NIN",
  );

  assert.ok(submission);
  assert.equal("documentStorageKey" in submission, false);
});

test("rejects KYC documents with unsupported file signatures", async () => {
  const form = new FormData();
  form.append("documentType", "NIN");
  form.append(
    "document",
    new Blob(
      [Buffer.from("This is not a PDF document.")],
      { type: "application/pdf" },
    ),
    "fake.pdf",
  );

  const response = await requestWithToken(
    "/riders/kyc/submissions",
    riderToken,
    {
      method: "POST",
      body: form,
    },
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Only PDF, JPEG, and PNG documents are accepted.");
});

test("rejects KYC documents larger than 5 MB", async () => {
  const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 65);

  const form = new FormData();
  form.append("documentType", "NIN");
  form.append(
    "document",
    new Blob([oversizedBuffer], { type: "application/pdf" }),
    "oversized.pdf",
  );

  const response = await requestWithToken(
    "/riders/kyc/submissions",
    riderToken,
    {
      method: "POST",
      body: form,
    },
  );

  const body = await response.json();

  assert.equal(response.status, 413);
  assert.equal(body.success, false);
  assert.equal(body.message, "KYC document must not exceed 5 MB.");
});

test("rejects a rider whose account has been deactivated", async () => {
  await prisma.rider.update({
    where: { id: riderId },
    data: { isActive: false },
  });

  const response = await requestWithToken(
    "/rider-protected",
    riderToken,
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.message, "Rider account is unavailable.");
});
