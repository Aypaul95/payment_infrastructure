import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client";

import { prisma } from "../lib/prisma";

import {
  recordRiderWalletTransaction,
} from "./rider-wallet-ledger.service";

import {
  getVerifiedRiderBankAccount,
} from "./rider-bank-account.service";

import {
  initiatePaystackTransfer,
  verifyPaystackTransfer,
} from "./paystack-transfer.service";

export interface CreateRiderSettlementInput {
  riderId: string;
  bankAccountId: string;
  amount: bigint;
  idempotencyKey: string;
  reason?: string;
}

function validateCreateSettlementInput(
  input: CreateRiderSettlementInput,
) {
  if (!input.riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (!input.bankAccountId.trim()) {
    throw new Error("BANK_ACCOUNT_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_SETTLEMENT_AMOUNT");
  }

  if (input.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("SETTLEMENT_AMOUNT_TOO_LARGE");
  }

  if (input.reason && input.reason.trim().length > 100) {
    throw new Error("SETTLEMENT_REASON_TOO_LONG");
  }

    if (
    !input.idempotencyKey.trim() ||
    input.idempotencyKey.length > 128
  ) {
    throw new Error("INVALID_SETTLEMENT_IDEMPOTENCY_KEY");
  }
}

export async function createRiderSettlement(
  input: CreateRiderSettlementInput,
) {
  validateCreateSettlementInput(input);

  const existingSettlement = await prisma.riderSettlement.findUnique({
    where: {
      riderId_idempotencyKey: {
        riderId: input.riderId,
        idempotencyKey: input.idempotencyKey.trim(),
      },
    },
  });

  if (existingSettlement) {
    if (
      existingSettlement.bankAccountId !== input.bankAccountId ||
      existingSettlement.amount !== input.amount
    ) {
      throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST");
    }

    return existingSettlement;
  }

  const bankAccount = await getVerifiedRiderBankAccount(
    input.riderId,
    input.bankAccountId,
  );

  const reference = `RIDER_SETTLEMENT_${randomUUID()}`;

  try {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.riderWallet.findUnique({
        where: {
          riderId: input.riderId,
        },
      });

      if (!wallet) {
        throw new Error("RIDER_WALLET_NOT_FOUND");
      }

      if (wallet.currency !== "NGN") {
        throw new Error("UNSUPPORTED_SETTLEMENT_CURRENCY");
      }

      const settlement = await tx.riderSettlement.create({
        data: {
          riderId: input.riderId,
          walletId: wallet.id,
          bankAccountId: bankAccount.id,
          amount: input.amount,
          currency: wallet.currency,
          reference,
          idempotencyKey: input.idempotencyKey.trim(),
          status: "PENDING",
        },
      });

      await recordRiderWalletTransaction(tx, {
        walletId: wallet.id,
        type: "RESERVE",
        amount: input.amount,
        reference: `${reference}:reserve`,
        description: "Rider wallet settlement reservation",
        currency: wallet.currency,
      });

      return settlement;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.riderSettlement.findUnique({
        where: {
          riderId_idempotencyKey: {
            riderId: input.riderId,
            idempotencyKey: input.idempotencyKey.trim(),
          },
        },
      });

      if (
        duplicate &&
        duplicate.bankAccountId === input.bankAccountId &&
        duplicate.amount === input.amount
      ) {
        return duplicate;
      }

      if (duplicate) {
        throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST");
      }
    }

    throw error;
  }
}

export async function initiateRiderSettlement(
  settlementId: string,
) {
  if (!settlementId.trim()) {
    throw new Error("SETTLEMENT_ID_REQUIRED");
  }

  const settlement = await prisma.riderSettlement.findUnique({
    where: {
      id: settlementId,
    },
    include: {
      bankAccount: {
        select: {
          recipientCode: true,
          status: true,
        },
      },
    },
  });

  if (!settlement) {
    throw new Error("SETTLEMENT_NOT_FOUND");
  }

  if (
    settlement.status !== "PENDING" ||
    settlement.bankAccount.status !== "VERIFIED" ||
    !settlement.bankAccount.recipientCode
  ) {
    throw new Error("SETTLEMENT_NOT_AVAILABLE_FOR_PROCESSING");
  }

  const claimed = await prisma.riderSettlement.updateMany({
    where: {
      id: settlementId,
      status: "PENDING",
    },
    data: {
      status: "PROCESSING",
    },
  });

  if (claimed.count !== 1) {
    throw new Error("SETTLEMENT_NOT_AVAILABLE_FOR_PROCESSING");
  }

  const transfer = await initiatePaystackTransfer({
    recipientCode: settlement.bankAccount.recipientCode,
    amountKobo: settlement.amount,
    reference: settlement.reference,
    reason: "Rider wallet settlement",
  });

  const updated = await prisma.riderSettlement.updateMany({
    where: {
      id: settlement.id,
      status: "PROCESSING",
    },
    data: {
      paystackTransferCode: transfer.transferCode,
    },
  });

  if (updated.count !== 1) {
    throw new Error("SETTLEMENT_STATE_CHANGED_DURING_TRANSFER");
  }

  return prisma.riderSettlement.findUniqueOrThrow({
    where: {
      id: settlement.id,
    },
  });
}

export async function verifyRiderSettlement(
  settlementId: string,
) {
  if (!settlementId.trim()) {
    throw new Error("SETTLEMENT_ID_REQUIRED");
  }

  const settlement = await prisma.riderSettlement.findUnique({
    where: {
      id: settlementId,
    },
  });

  if (!settlement) {
    throw new Error("SETTLEMENT_NOT_FOUND");
  }

  if (
    settlement.status !== "PROCESSING" &&
    settlement.status !== "SUCCESSFUL"
  ) {
    throw new Error("SETTLEMENT_NOT_AVAILABLE_FOR_VERIFICATION");
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
    if (transfer.status === "reversed") {
      if (settlement.status === "PROCESSING") {
        const updated = await tx.riderSettlement.updateMany({
          where: {
            id: settlement.id,
            status: "PROCESSING",
          },
          data: {
            status: "REVERSED",
            processedAt: new Date(),
            failureReason: "Paystack confirmed transfer reversal.",
            paystackTransferCode: transfer.transferCode,
          },
        });

        if (updated.count !== 1) {
          throw new Error("SETTLEMENT_ALREADY_PROCESSED");
        }

        await recordRiderWalletTransaction(tx, {
          walletId: settlement.walletId,
          type: "RELEASE",
          amount: settlement.amount,
          reference: `${settlement.reference}:reversed`,
          description: "Released reserved funds after transfer reversal",
          currency: settlement.currency,
        });
      } else {
        const updated = await tx.riderSettlement.updateMany({
          where: {
            id: settlement.id,
            status: "SUCCESSFUL",
          },
          data: {
            status: "REVERSED",
            processedAt: new Date(),
            failureReason: "Paystack confirmed transfer reversal.",
            paystackTransferCode: transfer.transferCode,
          },
        });

        if (updated.count !== 1) {
          throw new Error("SETTLEMENT_ALREADY_PROCESSED");
        }

        await recordRiderWalletTransaction(tx, {
          walletId: settlement.walletId,
          type: "REVERSAL",
          amount: settlement.amount,
          reference: `${settlement.reference}:reversed`,
          description: "Restored funds after successful payout reversal",
          currency: settlement.currency,
        });
      }

      return {
        status: "REVERSED" as const,
        settlementId: settlement.id,
        reference: settlement.reference,
      };
    }

    if (settlement.status !== "PROCESSING") {
      throw new Error("SETTLEMENT_NOT_PROCESSING");
    }

    const successful = transfer.status === "success";

    const updated = await tx.riderSettlement.updateMany({
      where: {
        id: settlement.id,
        status: "PROCESSING",
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
      throw new Error("SETTLEMENT_ALREADY_PROCESSED");
    }

    await recordRiderWalletTransaction(tx, {
      walletId: settlement.walletId,
      type: successful ? "PAYOUT" : "RELEASE",
      amount: settlement.amount,
      reference: `${settlement.reference}:${transfer.status}`,
      description: successful
        ? "Confirmed rider settlement payout"
        : "Released funds after failed rider settlement",
      currency: settlement.currency,
    });

    return {
      status: successful ? "SUCCESSFUL" as const : "FAILED" as const,
      settlementId: settlement.id,
      reference: settlement.reference,
    };
  });
}