
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { initializePaystackTransaction } from "./paystack.service";

type OrderCheckoutInput = {
  businessAccountId: string;
  orderId: string;
  idempotencyKey: string;
  email?: string;
};

const MAX_SAFE_AMOUNT = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_TRANSACTION_ATTEMPTS = 3;
const CHECKOUT_LOCK_DURATION_MS = 60 * 1000;

function getPrismaErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

export async function createOrderCheckout(
  input: OrderCheckoutInput,
) {
  let payment:
    | (Awaited<ReturnType<typeof prisma.payment.findUnique>> & {
        email: string;
      })
    | null = null;

  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_ATTEMPTS;
    attempt++
  ) {
    try {
      payment = await prisma.$transaction(
        async (tx) => {
          const order = await tx.order.findFirst({
            where: {
              id: input.orderId,
              businessAccountId: input.businessAccountId,
            },
            select: {
              id: true,
              orderNumber: true,
              customerId: true,
              status: true,
              total: true,
              currency: true,
              customer: {
                select: {
                  email: true,
                },
              },
            },
          });

          if (!order) {
            throw new Error("ORDER_NOT_FOUND");
          }

          const existingPayment = await tx.payment.findUnique({
            where: {
              businessAccountId_idempotencyKey: {
                businessAccountId: input.businessAccountId,
                idempotencyKey: input.idempotencyKey,
              },
            },
          });

          if (existingPayment) {
            if (
              existingPayment.orderId !== order.id ||
              existingPayment.customerId !== order.customerId ||
              existingPayment.amount !== order.total ||
              existingPayment.currency !== order.currency
            ) {
              throw new Error("IDEMPOTENCY_KEY_REUSED");
            }

            if (existingPayment.status === "SUCCESSFUL") {
              return {
                ...existingPayment,
                email: order.customer.email ?? input.email?.trim() ?? "",
              };
            }

            if (existingPayment.status === "FAILED") {
              throw new Error("PAYMENT_ATTEMPT_FAILED");
            }

            return {
              ...existingPayment,
              email: order.customer.email ?? input.email?.trim() ?? "",
            };
          }

          if (order.status !== "PENDING_PAYMENT") {
            throw new Error("ORDER_NOT_PAYABLE");
          }

          if (
            order.total <= 0n ||
            order.total > MAX_SAFE_AMOUNT
          ) {
            throw new Error("INVALID_PAYMENT_AMOUNT");
          }

          const previousPayments = await tx.payment.findMany({
            where: {
              orderId: order.id,
              businessAccountId: input.businessAccountId,
            },
            select: {
              status: true,
            },
          });

          if (
            previousPayments.some(
              (item) => item.status === "SUCCESSFUL",
            )
          ) {
            throw new Error("PAYMENT_ALREADY_SUCCESSFUL");
          }

          if (
            previousPayments.some(
              (item) => item.status === "PENDING",
            )
          ) {
            throw new Error("PAYMENT_ATTEMPT_IN_PROGRESS");
          }

          const email =
            order.customer.email ?? input.email?.trim() ?? "";

          if (!email) {
            throw new Error("CUSTOMER_EMAIL_REQUIRED");
          }

          const createdPayment = await tx.payment.create({
            data: {
              businessAccountId: input.businessAccountId,
              customerId: order.customerId,
              orderId: order.id,
              idempotencyKey: input.idempotencyKey,
              reference: `PAY-${randomUUID()}`,
              amount: order.total,
              currency: order.currency,
              description: `Payment for order ${order.orderNumber}`,
              nextReconciliationAt: new Date(
                Date.now() + 5 * 60 * 1000,
              ),
            },
          });

          return {
            ...createdPayment,
            email,
          };
        },
        {
          isolationLevel: "Serializable",
        },
      );

      break;
    } catch (error) {
      const errorCode = getPrismaErrorCode(error);

        if (
            ["P2034", "P2002"].includes(errorCode ?? "") &&
            attempt < MAX_TRANSACTION_ATTEMPTS
        ) {
            continue;
        }

        if (errorCode === "P2034" || errorCode === "P2002") {
            throw new Error("CHECKOUT_CONCURRENCY_RETRY_EXHAUSTED");
        }

      throw error;
    }
  }

  if (!payment) {
    throw new Error("CHECKOUT_CONCURRENCY_RETRY_EXHAUSTED");
  }

    if (payment.status === "SUCCESSFUL") {
        return {
            paymentId: payment.id,
            reference: payment.reference,
            amount: payment.amount.toString(),
            currency: payment.currency,
            status: payment.status,
        };
    }

  if (payment.authorizationUrl && payment.accessCode) {
    return {
      paymentId: payment.id,
      reference: payment.reference,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      authorizationUrl: payment.authorizationUrl,
      accessCode: payment.accessCode,
    };
  }

  if (payment.status !== "PENDING") {
    throw new Error("PAYMENT_NOT_PENDING");
  }

  if (!payment.email) {
    throw new Error("CUSTOMER_EMAIL_REQUIRED");
  }

    const checkoutLockToken = randomUUID();
    const checkoutLockExpiry = new Date(
        Date.now() + CHECKOUT_LOCK_DURATION_MS,
    );

    const checkoutClaim = await prisma.payment.updateMany({
        where: {
            id: payment.id,
            status: "PENDING",
            authorizationUrl: null,
            accessCode: null,
            OR: [
                { checkoutLockedUntil: null },
                { checkoutLockedUntil: { lt: new Date() } },
            ],
        },
        data: {
            checkoutLockedUntil: checkoutLockExpiry,
            checkoutLockToken,
        },
    });

    if (checkoutClaim.count !== 1) {
        const latestPayment = await prisma.payment.findUnique({
            where: { id: payment.id },
        });

        if (
            latestPayment?.authorizationUrl &&
            latestPayment.accessCode
        ) {
            return {
                paymentId: latestPayment.id,
                reference: latestPayment.reference,
                amount: latestPayment.amount.toString(),
                currency: latestPayment.currency,
                status: latestPayment.status,
                authorizationUrl: latestPayment.authorizationUrl,
                accessCode: latestPayment.accessCode,
            };
        }

        throw new Error("CHECKOUT_INITIALIZATION_IN_PROGRESS");
    }

    let session;

    try {
        session = await initializePaystackTransaction({
            email: payment.email,
            amount: payment.amount.toString(),
            currency: payment.currency,
            reference: payment.reference,
            paymentId: payment.id,
            businessAccountId: payment.businessAccountId,
        });
    } catch (error) {
        await prisma.payment.updateMany({
            where: {
                id: payment.id,
                checkoutLockToken,
            },
            data: {
                checkoutLockedUntil: null,
                checkoutLockToken: null,
            },
        });

        throw error;
    }

    const savedPayment = await prisma.payment.updateMany({
        where: {
            id: payment.id,
            status: "PENDING",
            checkoutLockToken,
        },
        data: {
            authorizationUrl: session.authorizationUrl,
            accessCode: session.accessCode,
            checkoutLockedUntil: null,
            checkoutLockToken: null,
        },
    });

    if (savedPayment.count !== 1) {
        throw new Error("CHECKOUT_LOCK_LOST");
    }

    const completedPayment = await prisma.payment.findUniqueOrThrow({
        where: {
            id: payment.id,
        },
    });

    return {
        paymentId: completedPayment.id,
        reference: completedPayment.reference,
        amount: completedPayment.amount.toString(),
        currency: completedPayment.currency,
        status: completedPayment.status,
        authorizationUrl: completedPayment.authorizationUrl,
        accessCode: completedPayment.accessCode,
    };
}
