
import { prisma } from "../lib/prisma";
import type { CreatePaymentInput } from "../validators/payment.validator";
import { isSamePaymentRequest } from "./payment-idempotency";


export async function createPayment(
  businessAccountId: string,
  input: CreatePaymentInput,
) {
  const amount = BigInt(input.amount);

  // Look for a payment created with this key by this business.
  const existingPayment = await prisma.payment.findUnique({
    where: {
      businessAccountId_idempotencyKey: {
        businessAccountId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    select: {
      id: true,
      businessAccountId: true,
      customerId: true,
      idempotencyKey: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

    if (existingPayment) {
        const sameRequest = isSamePaymentRequest(existingPayment, {
            customerId: input.customerId,
            amount,
            currency: input.currency,
            description: input.description,
        });

        if (!sameRequest) {
            throw new Error("IDEMPOTENCY_KEY_REUSED");
        }

        return existingPayment;
    }
  // If a customer was supplied, verify that the customer
  // belongs to the authenticated business.
  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: input.customerId,
        businessAccountId,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }
  }

 try {
  return await prisma.payment.create({
    data: {
      businessAccountId,
      idempotencyKey: input.idempotencyKey,
      customerId: input.customerId,
      reference: `PAY-${crypto.randomUUID()}`,
      amount,
      currency: input.currency,
      description: input.description,
      status: "PENDING",
    },
    select: {
      id: true,
      businessAccountId: true,
      customerId: true,
      idempotencyKey: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
} catch (error) {
  // Handle a duplicate idempotency key caused by a concurrent request.
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "P2002"
  ) {
    const existingPayment = await prisma.payment.findUnique({
      where: {
        businessAccountId_idempotencyKey: {
          businessAccountId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      select: {
        id: true,
        businessAccountId: true,
        customerId: true,
        idempotencyKey: true,
        reference: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

      if (existingPayment) {
          const sameRequest = isSamePaymentRequest(existingPayment, {
              customerId: input.customerId,
              amount,
              currency: input.currency,
              description: input.description,
          });

          if (!sameRequest) {
              throw new Error("IDEMPOTENCY_KEY_REUSED");
          }

          return existingPayment;
      }
  }

  throw error;
}
}


export async function listPayments(businessAccountId: string) {
  return prisma.payment.findMany({
    where: {
      businessAccountId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      businessAccountId: true,
      customerId: true,
      idempotencyKey: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getPaymentById(
  businessAccountId: string,
  paymentId: string,
) {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      businessAccountId,
    },
    select: {
      id: true,
      businessAccountId: true,
      customerId: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updatePaymentStatus(
  businessAccountId: string,
  paymentId: string,
  newStatus: "SUCCESSFUL" | "FAILED",
) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      businessAccountId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.status !== "PENDING") {
    throw new Error("PAYMENT_STATUS_FINAL");
  }

  return prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: newStatus,
    },
    select: {
      id: true,
      businessAccountId: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}