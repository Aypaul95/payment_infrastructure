import { prisma } from "../lib/prisma";
import { verifyPaystackTransaction } from "./paystack.service";

export type PaymentConfirmationResult =
  | {
      outcome: "SUCCESSFUL";
      paymentId: string;
      reference: string;
    }
  | {
      outcome: "DUPLICATE_CHARGE";
      paymentId: string;
      reference: string;
      orderId: string;
      orderStatus: string;
    }
  | {
      outcome: "PENDING";
      paymentId: string;
      reference: string;
      providerStatus: string;
    }
  | {
      outcome: "NOT_FOUND";
    }
  | {
      outcome: "DETAILS_MISMATCH";
      paymentId: string;
      reference: string;
    }
  | {
      outcome: "NOT_PENDING";
      paymentId: string;
      reference: string;
      currentStatus: string;
    }
  | {
      outcome: "FAILED";
      paymentId: string;
      reference: string;
    };

type PaymentRecord = {
  id: string;
  businessAccountId: string;
  reference: string;
  amount: bigint;
  currency: string;
  status: string;
  orderId: string | null;
};

type PaymentConfirmationDependencies = {
  findFirst: (args: {
    where: {
      reference: string;
      businessAccountId?: string;
    };
    select: {
      id: true;
      businessAccountId: true;
      reference: true;
      amount: true;
      currency: true;
      status: true;
      orderId: true;
    };
  }) => Promise<PaymentRecord | null>;

  confirmSuccessfulPayment: (payment: {
    id: string;
    businessAccountId: string;
    orderId: string | null;
  }) => Promise<
    | { outcome: "SUCCESSFUL" }
    | { outcome: "DUPLICATE_CHARGE"; orderStatus: string }
    | { outcome: "NOT_PENDING"; currentStatus: string }
  >;

    markFailedPayment: (payment: {
        id: string;
        businessAccountId: string;
    }) => Promise<
        | { outcome: "FAILED" }
        | { outcome: "NOT_PENDING"; currentStatus: string }
    >;

  verifyTransaction: (reference: string) => Promise<{
    reference: string;
    amount: number;
    currency: string;
    status: string;
  }>;
};


const defaultDependencies: PaymentConfirmationDependencies = {
    findFirst: (args) =>
        prisma.payment.findFirst(args) as Promise<PaymentRecord | null>,

    confirmSuccessfulPayment: (payment) =>
        prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.updateMany({
                where: {
                    id: payment.id,
                    businessAccountId: payment.businessAccountId,
                    status: "PENDING",
                },
                data: {
                    status: "SUCCESSFUL",
                },
            });

            if (updatedPayment.count !== 1) {
                const latestPayment = await tx.payment.findUnique({
                    where: { id: payment.id },
                    select: { status: true },
                });

                if (latestPayment?.status === "SUCCESSFUL") {
                    return { outcome: "SUCCESSFUL" as const };
                }

                return {
                    outcome: "NOT_PENDING" as const,
                    currentStatus: latestPayment?.status ?? "UNKNOWN",
                };
            }

            // Standalone payments do not have an associated order.
            if (!payment.orderId) {
                return { outcome: "SUCCESSFUL" as const };
            }

            // Atomically mark the order as paid if it is awaiting payment.
            const updatedOrder = await tx.order.updateMany({
                where: {
                    id: payment.orderId,
                    businessAccountId: payment.businessAccountId,
                    status: "PENDING_PAYMENT",
                },
                data: {
                    status: "PAID",
                },
            });

            if (updatedOrder.count === 1) {
                return { outcome: "SUCCESSFUL" as const };
            }

            // The payment succeeded, but this order was no longer awaiting payment.
            // Preserve the successful payment and flag the additional charge.
            const latestOrder = await tx.order.findUnique({
                where: { id: payment.orderId },
                select: { status: true },
            });

            return {
                outcome: "DUPLICATE_CHARGE" as const,
                orderStatus: latestOrder?.status ?? "UNKNOWN",
            };
        }),

    markFailedPayment: (payment) =>
        prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.updateMany({
                where: {
                    id: payment.id,
                    businessAccountId: payment.businessAccountId,
                    status: "PENDING",
                },
                data: {
                    status: "FAILED",
                },
            });

            if (updatedPayment.count === 1) {
                return { outcome: "FAILED" as const };
            }

            const latestPayment = await tx.payment.findUnique({
                where: { id: payment.id },
                select: { status: true },
            });

            return {
                outcome: "NOT_PENDING" as const,
                currentStatus: latestPayment?.status ?? "UNKNOWN",
            };
        }),

    verifyTransaction: verifyPaystackTransaction,
};

export async function confirmPaymentWithDependencies(
  reference: string,
  dependencies: PaymentConfirmationDependencies,
  businessAccountId?: string,
): Promise<PaymentConfirmationResult> {
  const payment = await dependencies.findFirst({
    where: {
      reference,
      ...(businessAccountId ? { businessAccountId } : {}),
    },
    select: {
      id: true,
      businessAccountId: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      orderId: true,
    },
  });

  if (!payment) {
    return { outcome: "NOT_FOUND" };
  }

  if (payment.status === "SUCCESSFUL") {
    return {
      outcome: "SUCCESSFUL",
      paymentId: payment.id,
      reference: payment.reference,
    };
  }

  if (payment.status !== "PENDING") {
    return {
      outcome: "NOT_PENDING",
      paymentId: payment.id,
      reference: payment.reference,
      currentStatus: payment.status,
    };
  }

  const result = await dependencies.verifyTransaction(payment.reference);

  if (
    result.reference !== payment.reference ||
    !Number.isSafeInteger(result.amount) ||
    result.amount <= 0 ||
    BigInt(result.amount) !== payment.amount ||
    result.currency !== payment.currency
  ) {
    return {
      outcome: "DETAILS_MISMATCH",
      paymentId: payment.id,
      reference: payment.reference,
    };
  }

    if (result.status === "failed") {
        const failure = await dependencies.markFailedPayment({
            id: payment.id,
            businessAccountId: payment.businessAccountId,
        });

        if (failure.outcome === "FAILED") {
            return {
                outcome: "FAILED",
                paymentId: payment.id,
                reference: payment.reference,
            };
        }

        return {
            outcome: "NOT_PENDING",
            paymentId: payment.id,
            reference: payment.reference,
            currentStatus: failure.currentStatus,
        };
    }

    if (result.status !== "success") {
        return {
            outcome: "PENDING",
            paymentId: payment.id,
            reference: payment.reference,
            providerStatus: result.status,
        };
    }

  const confirmation = await dependencies.confirmSuccessfulPayment({
    id: payment.id,
    businessAccountId: payment.businessAccountId,
    orderId: payment.orderId,
  });

  if (confirmation.outcome === "SUCCESSFUL") {
    return {
      outcome: "SUCCESSFUL",
      paymentId: payment.id,
      reference: payment.reference,
    };
  }

  if (confirmation.outcome === "DUPLICATE_CHARGE") {
    return {
      outcome: "DUPLICATE_CHARGE",
      paymentId: payment.id,
      reference: payment.reference,
      orderId: payment.orderId!,
      orderStatus: confirmation.orderStatus,
    };
  }

  return {
    outcome: "NOT_PENDING",
    paymentId: payment.id,
    reference: payment.reference,
    currentStatus: confirmation.currentStatus,
  };
}

export async function confirmPayment(
  reference: string,
  businessAccountId?: string,
): Promise<PaymentConfirmationResult> {
  return confirmPaymentWithDependencies(
    reference,
    defaultDependencies,
    businessAccountId,
  );
}