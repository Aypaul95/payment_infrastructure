import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import {
  reserveVendorSettlementFunds,
  releaseVendorSettlementFunds,
  recordVendorSettlementPayout,
  recordVendorLedgerEntry,
} from "./vendor-ledger.service";
import {
  initiatePaystackTransfer,
  verifyPaystackTransfer,
} from "./paystack-transfer.service";

export interface CreateVendorSettlementInput {
  businessAccountId: string;
  userRole: string;
  bankAccountId: string;
  amount: bigint;
  idempotencyKey: string;
}

function validateSettlementInput(
  input: CreateVendorSettlementInput,
): void {
  if (!input.businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  if (input.userRole !== "OWNER") {
    throw new Error("VENDOR_SETTLEMENT_OWNER_ONLY");
  }

  if (!input.bankAccountId.trim()) {
    throw new Error("BANK_ACCOUNT_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_VENDOR_SETTLEMENT_AMOUNT");
  }

  if (!input.idempotencyKey.trim()) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }
}

async function getAvailableBalanceInTransaction(
  tx: Prisma.TransactionClient,
  businessAccountId: string,
): Promise<bigint> {
  const entries = await tx.vendorLedgerEntry.groupBy({
    by: ["direction"],
    where: {
      businessAccountId,
      bucket: "AVAILABLE",
      currency: "NGN",
    },
    _sum: {
      amount: true,
    },
  });

  let balance = 0n;

  for (const entry of entries) {
    const amount = entry._sum.amount ?? 0n;

    balance += entry.direction === "CREDIT"
      ? amount
      : -amount;
  }

  return balance;
}

export async function createVendorSettlement(
  input: CreateVendorSettlementInput,
) {
  validateSettlementInput(input);

  return prisma.$transaction(async (tx) => {
    // Serialize settlement requests for this business.
    const lockedBusiness = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "BusinessAccount"
      WHERE "id" = ${input.businessAccountId}
      FOR UPDATE
    `;

    if (lockedBusiness.length === 0) {
      throw new Error("BUSINESS_ACCOUNT_NOT_FOUND");
    }

    // Return the existing request for an idempotent retry.
    const existing = await tx.vendorSettlement.findUnique({
      where: {
        businessAccountId_idempotencyKey: {
          businessAccountId: input.businessAccountId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });

      if (existing) {
          if (
              existing.bankAccountId !== input.bankAccountId ||
              existing.amount !== input.amount
          ) {
              throw new Error(
                  "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST",
              );
          }

          return existing;
      }

    // Only verified NGN accounts with a Paystack recipient are eligible.
    const bankAccount = await tx.vendorBankAccount.findFirst({
      where: {
        id: input.bankAccountId,
        businessAccountId: input.businessAccountId,
        status: "VERIFIED",
        recipientCode: { not: null },
        currency: "NGN",
      },
      select: { id: true },
    });

    if (!bankAccount) {
      throw new Error("VERIFIED_VENDOR_BANK_ACCOUNT_NOT_FOUND");
    }

    const availableBalance = await getAvailableBalanceInTransaction(
      tx,
      input.businessAccountId,
    );

    if (input.amount > availableBalance) {
      throw new Error("INSUFFICIENT_VENDOR_BALANCE");
    }

    const reference = `VSET-${randomUUID()}`;

    const settlement = await tx.vendorSettlement.create({
      data: {
        businessAccountId: input.businessAccountId,
        bankAccountId: input.bankAccountId,
        amount: input.amount,
        currency: "NGN",
        status: "PENDING",
        reference,
        idempotencyKey: input.idempotencyKey,
      },
    });

    await reserveVendorSettlementFunds(tx, {
      businessAccountId: input.businessAccountId,
      settlementId: settlement.id,
      amount: input.amount,
      reference: `VSET-RESERVE-${settlement.id}`,
    });

    return settlement;
  });
}

export async function listVendorSettlements(
  businessAccountId: string,
  userRole: string,
) {
  if (!businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  if (userRole !== "OWNER") {
    throw new Error("VENDOR_SETTLEMENT_OWNER_ONLY");
  }

  return prisma.vendorSettlement.findMany({
    where: { businessAccountId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      reference: true,
      failureReason: true,
      processedAt: true,
      createdAt: true,
      bankAccount: {
        select: {
          bankName: true,
          maskedAccountNumber: true,
          accountName: true,
        },
      },
    },
  });
}

export async function initiateVendorSettlement(
  businessAccountId: string,
  settlementId: string,
  userRole: string,
) {
  if (userRole !== "OWNER") {
    throw new Error("VENDOR_SETTLEMENT_OWNER_ONLY");
  }

  const settlement = await prisma.$transaction(async (tx) => {
    const claimed = await tx.vendorSettlement.updateMany({
      where: {
        id: settlementId,
        businessAccountId,
        status: "PENDING",
      },
      data: { status: "PROCESSING" },
    });

    if (claimed.count !== 1) {
      throw new Error("VENDOR_SETTLEMENT_NOT_PENDING");
    }

    return tx.vendorSettlement.findFirstOrThrow({
      where: { id: settlementId, businessAccountId },
      include: {
        bankAccount: {
          select: { recipientCode: true },
        },
      },
    });
  });

  if (!settlement.bankAccount.recipientCode) {
    await prisma.vendorSettlement.update({
      where: { id: settlement.id },
      data: {
        status: "REQUIRES_RECONCILIATION",
        failureReason: "PAYSTACK_RECIPIENT_CODE_MISSING",
      },
    });

    throw new Error("PAYSTACK_RECIPIENT_CODE_MISSING");
  }

  try {
    const transfer = await initiatePaystackTransfer({
      recipientCode: settlement.bankAccount.recipientCode,
      amountKobo: settlement.amount,
      reference: settlement.reference,
      reason: `Vendor settlement ${settlement.id}`,
    });

    return await prisma.vendorSettlement.update({
      where: { id: settlement.id },
      data: {
        paystackTransferCode: transfer.transferCode,
      },
    });
  } catch (error) {
    await prisma.vendorSettlement.update({
      where: { id: settlement.id },
      data: {
        status: "REQUIRES_RECONCILIATION",
        failureReason:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "UNKNOWN_PAYSTACK_TRANSFER_ERROR",
      },
    });

    throw error;
  }
}

export async function verifyVendorSettlement(
  businessAccountId: string,
  settlementId: string,
  userRole: string,
) {
  if (userRole !== "OWNER") {
    throw new Error("VENDOR_SETTLEMENT_OWNER_ONLY");
  }

  if (!businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  if (!settlementId.trim()) {
    throw new Error("SETTLEMENT_ID_REQUIRED");
  }

  const settlement = await prisma.vendorSettlement.findFirst({
    where: {
      id: settlementId,
      businessAccountId,
    },
  });

  if (!settlement) {
    throw new Error("VENDOR_SETTLEMENT_NOT_FOUND");
  }

  if (
    settlement.status !== "PROCESSING" &&
    settlement.status !== "REQUIRES_RECONCILIATION" &&
    settlement.status !== "SUCCESSFUL"
  ) {
    throw new Error("VENDOR_SETTLEMENT_NOT_AVAILABLE_FOR_VERIFICATION");
  }

  const transfer = await verifyPaystackTransfer(
    settlement.reference,
  );

  if (
    transfer.reference !== settlement.reference ||
    transfer.amount !== settlement.amount ||
    transfer.currency !== settlement.currency ||
    (
      settlement.paystackTransferCode &&
      transfer.transferCode !== settlement.paystackTransferCode
    )
  ) {
    throw new Error("PAYSTACK_TRANSFER_DETAILS_MISMATCH");
  }

  if (
    transfer.status !== "success" &&
    transfer.status !== "failed" &&
    transfer.status !== "reversed"
  ) {
    return {
      status: settlement.status,
      message: "Transfer is still awaiting confirmation.",
    };
  }

    return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id"
      FROM "VendorSettlement"
      WHERE "id" = ${settlement.id}
      FOR UPDATE
    `;

    const current = await tx.vendorSettlement.findUniqueOrThrow({
      where: { id: settlement.id },
    });

    if (current.status === "REVERSED") {
      return {
        status: "REVERSED" as const,
        settlementId: current.id,
        reference: current.reference,
      };
    }

    if (transfer.status === "reversed") {
      const wasSuccessful = current.status === "SUCCESSFUL";

      if (
        !wasSuccessful &&
        current.status !== "PROCESSING" &&
        current.status !== "REQUIRES_RECONCILIATION"
      ) {
        throw new Error("VENDOR_SETTLEMENT_NOT_REVERSIBLE");
      }

      const updated = await tx.vendorSettlement.updateMany({
        where: {
          id: current.id,
          status: current.status,
        },
        data: {
          status: "REVERSED",
          processedAt: new Date(),
          failureReason: "Paystack confirmed transfer reversal.",
          paystackTransferCode: transfer.transferCode,
        },
      });

      if (updated.count !== 1) {
        throw new Error("VENDOR_SETTLEMENT_ALREADY_PROCESSED");
      }

      if (wasSuccessful) {
        await recordVendorLedgerEntry(tx, {
          businessAccountId: current.businessAccountId,
          settlementId: current.id,
          bucket: "AVAILABLE",
          direction: "CREDIT",
          type: "REVERSAL",
          amount: current.amount,
          reference: `${current.reference}:reversed`,
          description: "Restored vendor funds after payout reversal",
        });
      } else {
        await releaseVendorSettlementFunds(tx, {
          businessAccountId: current.businessAccountId,
          settlementId: current.id,
          amount: current.amount,
          reference: `${current.reference}:reversed-release`,
          description: "Released reserved funds after transfer reversal",
        });
      }

      return {
        status: "REVERSED" as const,
        settlementId: current.id,
        reference: current.reference,
      };
    }

        const successful = transfer.status === "success";

    if (
      current.status === "SUCCESSFUL" &&
      successful
    ) {
      return {
        status: "SUCCESSFUL" as const,
        settlementId: current.id,
        reference: current.reference,
      };
    }

    if (
      current.status !== "PROCESSING" &&
      current.status !== "REQUIRES_RECONCILIATION"
    ) {
      throw new Error("VENDOR_SETTLEMENT_NOT_PROCESSABLE");
    }

    const updated = await tx.vendorSettlement.updateMany({
      where: {
        id: current.id,
        status: current.status,
      },
      data: {
        status: successful ? "SUCCESSFUL" : "FAILED",
        processedAt: new Date(),
        failureReason: successful
          ? null
          : "Paystack confirmed transfer failure.",
        paystackTransferCode: transfer.transferCode,
      },
    });

    if (updated.count !== 1) {
      throw new Error("VENDOR_SETTLEMENT_ALREADY_PROCESSED");
    }

    if (successful) {
      await recordVendorSettlementPayout(tx, {
        businessAccountId: current.businessAccountId,
        settlementId: current.id,
        amount: current.amount,
        reference: `${current.reference}:payout`,
        description: "Completed vendor settlement payout",
      });
    } else {
      await releaseVendorSettlementFunds(tx, {
        businessAccountId: current.businessAccountId,
        settlementId: current.id,
        amount: current.amount,
        reference: `${current.reference}:failed-release`,
        description: "Released reserved funds after failed vendor settlement",
      });
    }

    return {
      status: successful ? "SUCCESSFUL" as const : "FAILED" as const,
      settlementId: current.id,
      reference: current.reference,
    };
  });
}