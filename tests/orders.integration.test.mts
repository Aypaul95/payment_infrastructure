
import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for integration tests.");
}

const databaseName = new URL(databaseUrl).pathname.slice(1);

if (databaseName !== "payment_infrastructure_test") {
  throw new Error(
    "Order integration tests can only run against payment_infrastructure_test.",
  );
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma");
const { orderRouter } = await import("../src/routes/order.routes");
const { paymentRouter } = await import("../src/routes/payment.routes");

let businessAccountId = "";
let businessUserId = "";
let secondBusinessAccountId = "";
let secondBusinessUserId = "";
let customerId = "";
let secondBusinessCustomerId = "";
let server: ReturnType<typeof app.listen>;
let baseUrl = "";
let checkoutCustomerId = "";
let customerAddressId = "";
let checkoutCustomerAddressId = "";
let secondBusinessCustomerAddressId = "";

const app = express();
app.use(express.json());
app.use("/orders", orderRouter);
app.use("/payments", paymentRouter);

const mockPaystackInitializationCalls = new Map<string, number>();

let mockPaystackInitializationDelay: () => Promise<void> = async () => {};
function delayMockPaystackInitialization() {
  let release!: () => void;
  let markStarted!: () => void;

  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });

  let hasPausedFirstRequest = false;

  mockPaystackInitializationDelay = () => {
    if (hasPausedFirstRequest) {
      return Promise.resolve();
    }

    hasPausedFirstRequest = true;
    markStarted();

    return new Promise<void>((resolve) => {
      release = resolve;
    });
  };

  return {
    started,
    release: () => {
      mockPaystackInitializationDelay = async () => { };
      release();
    },
  };
}

app.post("/transaction/initialize", async (req, res) => {
  const reference = req.body.reference as string;

  mockPaystackInitializationCalls.set(
    reference,
    (mockPaystackInitializationCalls.get(reference) ?? 0) + 1,
  );

  await mockPaystackInitializationDelay();

  return res.status(200).json({
    status: true,
    message: "Authorization URL created",
    data: {
      authorization_url: "https://checkout.example.com/mock",
      access_code: "mock_access_code",
      reference,
    },
  });
});

function createToken(userId: string, accountId: string) {
  return jwt.sign(
    {
      businessAccountId: accountId,
      role: "OWNER",
    },
    jwtSecret!,
    {
      subject: userId,
      expiresIn: "15m",
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

function authHeaders(
  userId = businessUserId,
  accountId = businessAccountId,
) {
  return {
    Authorization: `Bearer ${createToken(userId, accountId)}`,
    "Content-Type": "application/json",
  };
}

async function createTestBusiness(name: string) {
  const business = await prisma.businessAccount.create({
    data: {
      businessName: name,
      email: `${randomUUID()}@example.com`,
    },
  });

  const user = await prisma.businessUser.create({
    data: {
      businessAccountId: business.id,
      fullName: "Order Integration Test Owner",
      email: `${randomUUID()}@example.com`,
      passwordHash: "integration-test-password-hash",
      role: "OWNER",
    },
  });

  return {
    businessAccountId: business.id,
    businessUserId: user.id,
  };
}

async function createTestProduct(
  accountId = businessAccountId,
  options: {
    quantity?: number;
    price?: bigint;
    isActive?: boolean;
  } = {},
) {
  const product = await prisma.product.create({
    data: {
      businessAccountId: accountId,
      name: "Integration Test Product",
      sku: `ORDER-${randomUUID()}`,
      price: options.price ?? 2500n,
      currency: "NGN",
      isActive: options.isActive ?? true,
    },
  });

  await prisma.inventory.create({
    data: {
      productId: product.id,
      quantity: options.quantity ?? 20,
      reservedQuantity: 0,
    },
  });

  return product;
}

async function createTestCustomerAddress(customerId: string) {
  return prisma.customerAddress.create({
    data: {
      customerId,
      label: "HOME",
      recipientName: "Integration Test Recipient",
      recipientPhone: "08012345678",
      streetAddress: "12 Test Street",
      city: "Ilorin",
      state: "Kwara",
      latitude: -8.4966,
      longitude: 4.5421,
      isDefault: true,
    },
  });
}

function createOrderPayload(
  productId: string,
  options: {
    idempotencyKey?: string;
    customerId?: string;
    customerAddressId?: string;
    quantity?: number;
    discount?: string;
  } = {},
) {
  const selectedCustomerId = options.customerId ?? customerId;

  const selectedAddressId =
    options.customerAddressId ??
    (selectedCustomerId === checkoutCustomerId
      ? checkoutCustomerAddressId
      : selectedCustomerId === secondBusinessCustomerId
        ? secondBusinessCustomerAddressId
        : customerAddressId);

  return {
    idempotencyKey: options.idempotencyKey ?? randomUUID(),
    customerId: selectedCustomerId,
    customerAddressId: selectedAddressId,
    items: [
      {
        productId,
        quantity: options.quantity ?? 2,
      },
    ],
    discount: options.discount ?? "0",
  };
}

async function createOrderRequest(
  payload: unknown,
  headers = authHeaders(),
) {
  return fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

before(async () => {
  const firstBusiness = await createTestBusiness(
    "Order Integration Test Business",
  );

  businessAccountId = firstBusiness.businessAccountId;
  businessUserId = firstBusiness.businessUserId;

  const secondBusiness = await createTestBusiness(
    "Second Order Integration Test Business",
  );

  secondBusinessAccountId = secondBusiness.businessAccountId;
  secondBusinessUserId = secondBusiness.businessUserId;

  const firstCustomer = await prisma.customer.create({
    data: {
      businessAccountId,
      name: "First Integration Test Customer",
    },
  });

  customerId = firstCustomer.id;
  const checkoutCustomer = await prisma.customer.create({
    data: {
      businessAccountId,
      name: "Checkout Integration Test Customer",
      email: "checkout-test@example.com",
    },
  });

  checkoutCustomerId = checkoutCustomer.id;

  const secondCustomer = await prisma.customer.create({
    data: {
      businessAccountId: secondBusinessAccountId,
      name: "Second Integration Test Customer",
    },
  });

  secondBusinessCustomerId = secondCustomer.id;

  const firstCustomerAddress =
    await createTestCustomerAddress(customerId);

  customerAddressId = firstCustomerAddress.id;

  const checkoutCustomerAddress =
    await createTestCustomerAddress(checkoutCustomerId);

  checkoutCustomerAddressId = checkoutCustomerAddress.id;

  const secondCustomerAddress =
    await createTestCustomerAddress(secondBusinessCustomerId);

  secondBusinessCustomerAddressId = secondCustomerAddress.id;

  server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to determine integration test server address.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  process.env.PAYSTACK_BASE_URL = baseUrl;
  process.env.PAYSTACK_SECRET_KEY = "test_paystack_secret_key";
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

  const businessIds = [
    businessAccountId,
    secondBusinessAccountId,
  ].filter(Boolean);

  if (businessIds.length > 0) {
    const orders = await prisma.order.findMany({
      where: {
        businessAccountId: { in: businessIds },
      },
      select: { id: true },
    });

    const orderIds = orders.map((order) => order.id);

    const payments = await prisma.payment.findMany({
      where: {
        businessAccountId: { in: businessIds },
      },
      select: { id: true },
    });

    const paymentIds = payments.map((payment) => payment.id);

    if (paymentIds.length > 0) {
      await prisma.paymentReconciliationAttempt.deleteMany({
        where: {
          paymentId: { in: paymentIds },
        },
      });

      await prisma.payment.deleteMany({
        where: {
          id: { in: paymentIds },
        },
      });
    }

    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: {
          orderId: { in: orderIds },
        },
      });

      await prisma.order.deleteMany({
        where: {
          id: { in: orderIds },
        },
      });
    }

    await prisma.inventoryMovement.deleteMany({
      where: {
        product: {
          businessAccountId: { in: businessIds },
        },
      },
    });

    await prisma.inventory.deleteMany({
      where: {
        product: {
          businessAccountId: { in: businessIds },
        },
      },
    });

    await prisma.product.deleteMany({
      where: {
        businessAccountId: { in: businessIds },
      },
    });

    await prisma.customerAddress.deleteMany({
      where: {
        customer: {
          businessAccountId: { in: businessIds },
        },
      },
    });

    await prisma.customer.deleteMany({
      where: {
        businessAccountId: { in: businessIds },
      },
    });

    await prisma.businessUser.deleteMany({
      where: {
        businessAccountId: { in: businessIds },
      },
    });

    await prisma.businessAccount.deleteMany({
      where: {
        id: { in: businessIds },
      },
    });
  }

  await prisma.$disconnect();
});

test("creates an order and reserves inventory", async () => {
  const product = await createTestProduct();

  const response = await createOrderRequest(
    createOrderPayload(product.id, {
      quantity: 2,
      discount: "500",
    }),
  );

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.message, "Order created successfully.");

  assert.equal(body.data.businessAccountId, businessAccountId);
  assert.equal(body.data.customerId, customerId);
  assert.equal(body.data.status, "PENDING_PAYMENT");

  assert.equal(body.data.subtotal, "5000");
  assert.equal(body.data.discount, "500");
  assert.equal(body.data.total, "4500");
  assert.equal(body.data.currency, "NGN");

  assert.equal(body.data.items.length, 1);
  assert.equal(body.data.items[0].quantity, 2);
  assert.equal(body.data.items[0].unitPrice, "2500");
  assert.equal(body.data.items[0].subtotal, "5000");

  const inventory = await prisma.inventory.findUnique({
    where: { productId: product.id },
  });

  assert.ok(inventory);
  assert.equal(inventory.quantity, 20);
  assert.equal(inventory.reservedQuantity, 2);

  const savedOrder = await prisma.order.findUnique({
    where: { id: body.data.id },
    include: { items: true },
  });

  assert.ok(savedOrder);
  assert.equal(savedOrder.items.length, 1);
});

test("returns the existing order for an identical idempotent request", async () => {
  const product = await createTestProduct();

  const payload = createOrderPayload(product.id, {
    idempotencyKey: `IDEMPOTENT-${randomUUID()}`,
    quantity: 3,
  });

  const firstResponse = await createOrderRequest(payload);
  const firstBody = await firstResponse.json();

  const secondResponse = await createOrderRequest(payload);
  const secondBody = await secondResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(firstBody.data.id, secondBody.data.id);

  const inventory = await prisma.inventory.findUnique({
    where: { productId: product.id },
  });

  assert.ok(inventory);
  assert.equal(inventory.reservedQuantity, 3);

  const orderCount = await prisma.order.count({
    where: {
      businessAccountId,
      idempotencyKey: payload.idempotencyKey,
    },
  });

  assert.equal(orderCount, 1);
});

test("rejects reuse of an idempotency key with different order data", async () => {
  const product = await createTestProduct();
  const idempotencyKey = `REUSED-${randomUUID()}`;

  const firstResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      idempotencyKey,
      quantity: 2,
    }),
  );

  assert.equal(firstResponse.status, 201);

  const secondResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      idempotencyKey,
      quantity: 5,
    }),
  );

  const body = await secondResponse.json();

  assert.equal(secondResponse.status, 409);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "This idempotency key was already used for a different order.",
  );

  const inventory = await prisma.inventory.findUnique({
    where: { productId: product.id },
  });

  assert.ok(inventory);
  assert.equal(inventory.reservedQuantity, 2);
});

test("rejects an order when available stock is insufficient", async () => {
  const product = await createTestProduct(businessAccountId, {
    quantity: 1,
  });

  const response = await createOrderRequest(
    createOrderPayload(product.id, {
      quantity: 2,
    }),
  );

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Insufficient available stock for one or more products.",
  );

  const inventory = await prisma.inventory.findUnique({
    where: { productId: product.id },
  });

  assert.ok(inventory);
  assert.equal(inventory.quantity, 1);
  assert.equal(inventory.reservedQuantity, 0);
});

test("rolls back all stock reservations when one product has insufficient stock", async () => {
    const firstProduct = await createTestProduct(businessAccountId, {
        quantity: 10,
    });

    const secondProduct = await createTestProduct(businessAccountId, {
        quantity: 0,
    });

    const idempotencyKey = `ROLLBACK-${randomUUID()}`;

    const response = await createOrderRequest({
        idempotencyKey,
        customerId,
        customerAddressId,
        items: [
            { productId: firstProduct.id, quantity: 2 },
            { productId: secondProduct.id, quantity: 1 },
        ],
        discount: "0",
    });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);

  const firstInventory = await prisma.inventory.findUnique({
    where: { productId: firstProduct.id },
  });

  const secondInventory = await prisma.inventory.findUnique({
    where: { productId: secondProduct.id },
  });

  assert.ok(firstInventory);
  assert.ok(secondInventory);

  assert.equal(firstInventory.reservedQuantity, 0);
  assert.equal(secondInventory.reservedQuantity, 0);

    const orderCount = await prisma.order.count({
        where: {
            businessAccountId,
            idempotencyKey,
        },
    });

    assert.equal(orderCount, 0);
});

test("rejects a customer belonging to another business", async () => {
  const product = await createTestProduct();

  const response = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: secondBusinessCustomerId,
    }),
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.message, "Customer not found.");
});

test("rejects a product belonging to another business", async () => {
  const product = await createTestProduct(secondBusinessAccountId);

  const response = await createOrderRequest(
    createOrderPayload(product.id),
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "One or more products were not found or are inactive.",
  );
});

test("rejects inactive products", async () => {
  const product = await createTestProduct(businessAccountId, {
    isActive: false,
  });

  const response = await createOrderRequest(
    createOrderPayload(product.id),
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "One or more products were not found or are inactive.",
  );
});

test("rejects a discount greater than the order subtotal", async () => {
  const product = await createTestProduct();

  const response = await createOrderRequest(
    createOrderPayload(product.id, {
      quantity: 1,
      discount: "3000",
    }),
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Discount cannot exceed the order subtotal.");

  const inventory = await prisma.inventory.findUnique({
    where: { productId: product.id },
  });

  assert.ok(inventory);
  assert.equal(inventory.reservedQuantity, 0);
});

test("lists orders belonging to the authenticated business", async () => {
  const product = await createTestProduct();

  const createResponse = await createOrderRequest(
    createOrderPayload(product.id),
  );

  const createdBody = await createResponse.json();

  const response = await fetch(`${baseUrl}/orders`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);

  assert.ok(
    body.data.some(
      (order: { id: string }) => order.id === createdBody.data.id,
    ),
  );
});

test("retrieves an order belonging to the authenticated business", async () => {
  const product = await createTestProduct();

  const createResponse = await createOrderRequest(
    createOrderPayload(product.id),
  );

  const createdBody = await createResponse.json();

  const response = await fetch(
    `${baseUrl}/orders/${createdBody.data.id}`,
    {
      headers: authHeaders(),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, createdBody.data.id);
  assert.equal(body.data.customer.id, customerId);
});

test("does not expose another business's order", async () => {
  const product = await createTestProduct(secondBusinessAccountId);

  const secondBusinessPayload = createOrderPayload(product.id, {
    customerId: secondBusinessCustomerId,
  });

  const createResponse = await createOrderRequest(
    secondBusinessPayload,
    authHeaders(secondBusinessUserId, secondBusinessAccountId),
  );

  const createdBody = await createResponse.json();

  assert.equal(createResponse.status, 201);

  const response = await fetch(
    `${baseUrl}/orders/${createdBody.data.id}`,
    {
      headers: authHeaders(),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.message, "Order not found.");
});

test("rejects invalid order data", async () => {
  const response = await createOrderRequest({
    idempotencyKey: "short",
    customerId,
    items: [],
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Invalid order data.");
  assert.ok(Array.isArray(body.errors));
});

test("rejects requests without an authentication token", async () => {
  const response = await fetch(`${baseUrl}/orders`);

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});

test("initializes Paystack checkout for an existing order", async () => {
  const product = await createTestProduct();

  const orderPayload = createOrderPayload(product.id, {
    customerId: checkoutCustomerId,
  });

  const orderResponse = await createOrderRequest(orderPayload);
  const orderBody = await orderResponse.json();

  assert.equal(orderResponse.status, 201);

  const idempotencyKey = randomUUID();

  const checkoutResponse = await fetch(
    `${baseUrl}/payments/orders/${orderBody.data.id}/checkout`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ idempotencyKey }),
    },
  );

  const checkoutBody = await checkoutResponse.json();

  assert.equal(checkoutResponse.status, 200);
  assert.equal(checkoutBody.success, true);
  assert.equal(
    checkoutBody.message,
    "Order checkout initialized successfully.",
  );

  assert.equal(checkoutBody.data.status, "PENDING");
  assert.equal(
    checkoutBody.data.authorizationUrl,
    "https://checkout.example.com/mock",
  );
  assert.equal(
    checkoutBody.data.accessCode,
    "mock_access_code",
  );

  assert.equal(
  mockPaystackInitializationCalls.get(checkoutBody.data.reference),
  1,
);
});
test("rejects checkout when the order has already been paid", async () => {
  const product = await createTestProduct();

  const orderResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: checkoutCustomerId,
    }),
  );

  const orderBody = await orderResponse.json();

  assert.equal(orderResponse.status, 201);

  const orderId = orderBody.data.id;

  const payment = await prisma.payment.create({
    data: {
      businessAccountId,
      customerId: checkoutCustomerId,
      orderId,
      idempotencyKey: randomUUID(),
      reference: `PAY-${randomUUID()}`,
      amount: BigInt(orderBody.data.total),
      currency: orderBody.data.currency,
      status: "SUCCESSFUL",
    },
  });

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: "PAID",
    },
  });

  const response = await fetch(
    `${baseUrl}/payments/orders/${orderId}/checkout`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        idempotencyKey: randomUUID(),
      }),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(
  body.message,
  "This order is not awaiting payment.",
);

  assert.equal(
    mockPaystackInitializationCalls.get(payment.reference) ?? 0,
    0,
  );

  assert.equal(payment.status, "SUCCESSFUL");
});

test("reuses an existing Paystack checkout session for the same idempotency key", async () => {
  const product = await createTestProduct();

  const orderResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: checkoutCustomerId,
    }),
  );

  const orderBody = await orderResponse.json();

  assert.equal(orderResponse.status, 201);

  const idempotencyKey = randomUUID();

  async function initializeCheckout() {
    return fetch(
      `${baseUrl}/payments/orders/${orderBody.data.id}/checkout`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ idempotencyKey }),
      },
    );
  }

  const firstResponse = await initializeCheckout();
  const firstBody = await firstResponse.json();

  assert.equal(firstResponse.status, 200);
  assert.equal(firstBody.success, true);

  const secondResponse = await initializeCheckout();
  const secondBody = await secondResponse.json();

  assert.equal(secondResponse.status, 200);
  assert.equal(secondBody.success, true);

  assert.equal(
    secondBody.data.paymentId,
    firstBody.data.paymentId,
  );

  assert.equal(
    secondBody.data.reference,
    firstBody.data.reference,
  );

  assert.equal(
    secondBody.data.authorizationUrl,
    firstBody.data.authorizationUrl,
  );

  assert.equal(
    secondBody.data.accessCode,
    firstBody.data.accessCode,
  );

  assert.equal(
    mockPaystackInitializationCalls.get(firstBody.data.reference),
    1,
  );
});

test("handles concurrent checkout requests with the same idempotency key", async () => {
  const product = await createTestProduct();

  const orderResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: checkoutCustomerId,
    }),
  );

  const orderBody = await orderResponse.json();

  assert.equal(orderResponse.status, 201);

  const idempotencyKey = randomUUID();

  async function initializeCheckout() {
    return fetch(
      `${baseUrl}/payments/orders/${orderBody.data.id}/checkout`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ idempotencyKey }),
      },
    );
  }

  const [firstResponse, secondResponse] = await Promise.all([
    initializeCheckout(),
    initializeCheckout(),
  ]);

  const [firstBody, secondBody] = await Promise.all([
    firstResponse.json(),
    secondResponse.json(),
  ]);

  assert.ok(
    [200, 409].includes(firstResponse.status),
  );

  assert.ok(
    [200, 409].includes(secondResponse.status),
  );

  const successfulBodies = [
    { status: firstResponse.status, body: firstBody },
    { status: secondResponse.status, body: secondBody },
  ].filter((result) => result.status === 200);

  assert.ok(successfulBodies.length >= 1);

  for (const result of successfulBodies) {
    assert.equal(
      result.body.data.reference,
      successfulBodies[0].body.data.reference,
    );
  }

  assert.equal(
    mockPaystackInitializationCalls.get(
      successfulBodies[0].body.data.reference,
    ),
    1,
  );
});

test("prevents an expired checkout lock owner from overwriting a newer session", async () => {
  const product = await createTestProduct();

  const orderResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: checkoutCustomerId,
    }),
  );

  const orderBody = await orderResponse.json();

  assert.equal(orderResponse.status, 201);

  const idempotencyKey = randomUUID();

  const delayed = delayMockPaystackInitialization();

  async function initializeCheckout() {
    return fetch(
      `${baseUrl}/payments/orders/${orderBody.data.id}/checkout`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ idempotencyKey }),
      },
    );
  }

  const firstRequest = initializeCheckout();

  try {
    await delayed.started;

    const payment = await prisma.payment.findFirstOrThrow({
      where: {
        orderId: orderBody.data.id,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        checkoutLockedUntil: new Date(Date.now() - 1000),
      },
    });

    const secondResponse = await initializeCheckout();
    const secondBody = await secondResponse.json();

    assert.equal(secondResponse.status, 200);

    assert.equal(
      secondBody.data.authorizationUrl,
      "https://checkout.example.com/mock",
    );

    delayed.release();

    const firstResponse = await firstRequest;
    const firstBody = await firstResponse.json();

    assert.equal(firstResponse.status, 409);
    assert.equal(firstBody.message, "Checkout initialization ownership was lost. Please retry checkout.");

    const savedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });

    assert.equal(
      savedPayment.authorizationUrl,
      secondBody.data.authorizationUrl,
    );

    assert.equal(
      savedPayment.accessCode,
      secondBody.data.accessCode,
    );

    assert.equal(savedPayment.checkoutLockToken, null);
    assert.equal(savedPayment.checkoutLockedUntil, null);
  } finally {
    delayed.release();
  }
});

test("rejects reuse of a checkout idempotency key for another order", async () => {
  const product = await createTestProduct();

  const firstOrderResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: checkoutCustomerId,
    }),
  );

  const firstOrderBody = await firstOrderResponse.json();

  assert.equal(firstOrderResponse.status, 201);

  const secondOrderResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: checkoutCustomerId,
    }),
  );

  const secondOrderBody = await secondOrderResponse.json();

  assert.equal(secondOrderResponse.status, 201);

  const idempotencyKey = randomUUID();

  async function initializeCheckout(orderId: string) {
    return fetch(
      `${baseUrl}/payments/orders/${orderId}/checkout`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ idempotencyKey }),
      },
    );
  }

  const firstResponse = await initializeCheckout(
    firstOrderBody.data.id,
  );

  assert.equal(firstResponse.status, 200);

  const secondResponse = await initializeCheckout(
    secondOrderBody.data.id,
  );

  const secondBody = await secondResponse.json();

  assert.equal(secondResponse.status, 409);
  assert.equal(secondBody.success, false);
  assert.equal(
    secondBody.message,
    "This idempotency key has already been used with different checkout details.",
  );
});

test("does not allow one business to initialize checkout for another business's order", async () => {
  const product = await createTestProduct(secondBusinessAccountId);

  const orderResponse = await createOrderRequest(
    createOrderPayload(product.id, {
      customerId: secondBusinessCustomerId,
    }),
    authHeaders(secondBusinessUserId, secondBusinessAccountId),
  );

  const orderBody = await orderResponse.json();

  assert.equal(orderResponse.status, 201);
 const callsBeforeRequest = mockPaystackInitializationCalls.size;

  const response = await fetch(
    `${baseUrl}/payments/orders/${orderBody.data.id}/checkout`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        idempotencyKey: randomUUID(),
      }),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.message, "Order not found.");

  assert.equal(
    mockPaystackInitializationCalls.size,
    callsBeforeRequest,
  );
});
