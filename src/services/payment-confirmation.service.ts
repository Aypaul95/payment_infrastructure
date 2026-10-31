
import { prisma } from "../lib/prisma";
import { verifyPaystackTransaction } from "./paystack.service";

// 1. Define every possible result the payment confirmation process can return.
export type PaymentConfirmationResult =
  | {
      outcome: "SUCCESSFUL";
      paymentId: string;
      reference: string;
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
    };

// 2. Define the structure of a payment record returned by the database.
type PaymentRecord = {
  id: string;
  businessAccountId: string;
  reference: string;
  amount: bigint;
  currency: string;
  status: string;
};

// 3. Define the database and Paystack operations required by this service.
//    These functions can use real services or fake functions during testing.
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
    };
  }) => Promise<PaymentRecord | null>;

  updateMany: (args: {
    where: {
      id: string;
      businessAccountId: string;
      status: "PENDING";
    };
    data: {
      status: "SUCCESSFUL";
    };
  }) => Promise<{ count: number }>;

  findUnique: (args: {
    where: { id: string };
    select: { status: true };
  }) => Promise<{ status: string } | null>;

  verifyTransaction: (reference: string) => Promise<{
    reference: string;
    amount: number;
    currency: string;
    status: string;
  }>;
};

// 4. Connect the dependencies to the real Prisma database and Paystack service.
//    The application uses these default dependencies when processing payments.
const defaultDependencies: PaymentConfirmationDependencies = {
  findFirst: (args) =>
    prisma.payment.findFirst(args) as Promise<PaymentRecord | null>,

  updateMany: (args) => prisma.payment.updateMany(args),

  findUnique: (args) => prisma.payment.findUnique(args),

  verifyTransaction: verifyPaystackTransaction,
};

// 5. Create the main payment confirmation function.
//    Dependencies are passed into this function so tests can use fake database
//    operations and a fake Paystack response without contacting real services.
export async function confirmPaymentWithDependencies(
  reference: string,
  dependencies: PaymentConfirmationDependencies,
  businessAccountId?: string,
): Promise<PaymentConfirmationResult> {
  // 5.1. Find the payment in our database using its transaction reference.
  //      If a business account ID is provided, restrict the search to that account.
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
    },
  });

  // 5.2. Return NOT_FOUND if no matching payment exists.
  if (!payment) {
    return { outcome: "NOT_FOUND" };
  }

  // 5.3. Check whether the payment has already been confirmed successfully.
  //      If it has, return SUCCESSFUL without contacting Paystack again.
  if (payment.status === "SUCCESSFUL") {
    return {
      outcome: "SUCCESSFUL",
      paymentId: payment.id,
      reference: payment.reference,
    };
  }

  // 5.4. Only payments with PENDING status can proceed to verification.
  //      Other statuses, such as FAILED, cannot be confirmed here.
  if (payment.status !== "PENDING") {
    return {
      outcome: "NOT_PENDING",
      paymentId: payment.id,
      reference: payment.reference,
      currentStatus: payment.status,
    };
  }

  // 5.5. Contact Paystack to independently verify the transaction.
  const result = await dependencies.verifyTransaction(payment.reference);

  // 5.6. Compare Paystack's transaction details with our database.
  //      Reject the confirmation if the reference, amount, or currency differs.
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

  // 5.7. Check Paystack's transaction status.
  //      If Paystack has not confirmed success, leave our payment as PENDING.
  if (result.status !== "success") {
    return {
      outcome: "PENDING",
      paymentId: payment.id,
      reference: payment.reference,
      providerStatus: result.status,
    };
  }

  // 5.8. Update the payment to SUCCESSFUL only if it is still PENDING.
  //      This condition helps prevent concurrent requests from confirming it twice.
  const updated = await dependencies.updateMany({
    where: {
      id: payment.id,
      businessAccountId: payment.businessAccountId,
      status: "PENDING",
    },
    data: {
      status: "SUCCESSFUL",
    },
  });

  // 5.9. If exactly one record was updated, confirmation succeeded.
  if (updated.count === 1) {
    return {
      outcome: "SUCCESSFUL",
      paymentId: payment.id,
      reference: payment.reference,
    };
  }

  // 5.10. If no record was updated, another request may have changed its status.
  //       Retrieve the latest payment status from the database.
  const latestPayment = await dependencies.findUnique({
    where: { id: payment.id },
    select: { status: true },
  });

  // 5.11. If another request already confirmed the payment, return SUCCESSFUL.
  if (latestPayment?.status === "SUCCESSFUL") {
    return {
      outcome: "SUCCESSFUL",
      paymentId: payment.id,
      reference: payment.reference,
    };
  }

  // 5.12. If the payment is still not confirmed, return its latest status.
  return {
    outcome: "NOT_PENDING",
    paymentId: payment.id,
    reference: payment.reference,
    currentStatus: latestPayment?.status ?? "UNKNOWN",
  };
}

// 6. Provide the main function used by the application's routes and webhook.
//    It passes the real Prisma and Paystack dependencies to the confirmation logic.
//    The existing function signature remains unchanged.
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