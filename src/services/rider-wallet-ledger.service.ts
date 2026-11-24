import { Prisma } from "../generated/prisma/client";

type WalletLedgerOperation =
  | "CREDIT"
  | "DEBIT"
  | "RESERVE"
  | "RELEASE"
  | "PAYOUT"
  | "REVERSAL";

export interface RecordWalletTransactionInput {
  walletId: string;
  type: WalletLedgerOperation;
  amount: bigint;
  reference: string;
  description?: string;
  currency?: string;
}

export async function recordRiderWalletTransaction(
  tx: Prisma.TransactionClient,
  input: RecordWalletTransactionInput,
) {
  if (!input.walletId.trim()) {
    throw new Error("WALLET_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_WALLET_TRANSACTION_AMOUNT");
  }

  if (!input.reference.trim()) {
    throw new Error("WALLET_TRANSACTION_REFERENCE_REQUIRED");
  }

  const currency = input.currency ?? "NGN";

  let updateResult;

  switch (input.type) {
    case "REVERSAL":
      updateResult = await tx.riderWallet.updateMany({
        where: {
          id: input.walletId,
          currency,
        },
        data: {
          availableBalance: {
            increment: input.amount,
          },
        },
      });
      break;

    case "CREDIT":
      updateResult = await tx.riderWallet.updateMany({
        where: {
          id: input.walletId,
          currency,
        },
        data: {
          availableBalance: {
            increment: input.amount,
          },
        },
      });
      break;

    case "DEBIT":
    case "RESERVE":
      updateResult = await tx.riderWallet.updateMany({
        where: {
          id: input.walletId,
          currency,
          availableBalance: {
            gte: input.amount,
          },
        },
        data: {
          availableBalance: {
            decrement: input.amount,
          },
          ...(input.type === "RESERVE"
            ? {
                reservedBalance: {
                  increment: input.amount,
                },
              }
            : {}),
        },
      });
      break;

    case "RELEASE":
    case "PAYOUT":
      updateResult = await tx.riderWallet.updateMany({
        where: {
          id: input.walletId,
          currency,
          reservedBalance: {
            gte: input.amount,
          },
        },
        data: {
          reservedBalance: {
            decrement: input.amount,
          },
          ...(input.type === "RELEASE"
            ? {
                availableBalance: {
                  increment: input.amount,
                },
              }
            : {}),
        },
      });
      break;
  }

  if (updateResult.count !== 1) {
    throw new Error("WALLET_NOT_FOUND_OR_INSUFFICIENT_BALANCE");
  }

  return tx.riderWalletTransaction.create({
    data: {
      walletId: input.walletId,
      type: input.type,
      amount: input.amount,
      reference: input.reference.trim(),
      description: input.description?.trim(),
      currency,
    },
  });
}