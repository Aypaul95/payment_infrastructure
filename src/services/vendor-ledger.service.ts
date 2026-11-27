import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

export type VendorLedgerBucket = "AVAILABLE" | "RESERVED";

export type VendorLedgerDirection = "CREDIT" | "DEBIT";

export type VendorLedgerEntryType =
  | "ORDER_CREDIT"
  | "SETTLEMENT_RESERVE"
  | "SETTLEMENT_RELEASE"
  | "SETTLEMENT_PAYOUT"
  | "REVERSAL"
  | "ADJUSTMENT";

  export interface VendorLedgerBalance {
  availableBalance: bigint;
  reservedBalance: bigint;
}

export interface TransferVendorLedgerInput {
  businessAccountId: string;
  amount: bigint;
  reference: string;
  settlementId: string;
  description?: string;
}

  export interface RecordVendorLedgerEntryInput {
  businessAccountId: string;
  bucket: VendorLedgerBucket;
  direction: VendorLedgerDirection;
  type: VendorLedgerEntryType;
  amount: bigint;
  reference: string;
  orderId?: string;
  settlementId?: string;
  recognitionKey?: string;
  description?: string;
  currency?: string;
}

export async function recordVendorLedgerEntry(
  tx: Prisma.TransactionClient,
  input: RecordVendorLedgerEntryInput,
) {
  if (!input.businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_VENDOR_LEDGER_AMOUNT");
  }

  if (!input.reference.trim()) {
    throw new Error("VENDOR_LEDGER_REFERENCE_REQUIRED");
  }

  return tx.vendorLedgerEntry.create({
    data: {
      businessAccountId: input.businessAccountId,
      bucket: input.bucket,
      direction: input.direction,
      type: input.type,
      amount: input.amount,
      reference: input.reference,
      orderId: input.orderId,
      settlementId: input.settlementId,
      recognitionKey: input.recognitionKey,
      description: input.description,
      currency: input.currency ?? "NGN",
    },
  });
}

export async function getVendorLedgerBalance(
  businessAccountId: string,
  currency = "NGN",
): Promise<VendorLedgerBalance> {
  if (!businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  const entries = await prisma.vendorLedgerEntry.groupBy({
    by: ["bucket", "direction"],
    where: {
      businessAccountId,
      currency,
    },
    _sum: {
      amount: true,
    },
  });

  let availableBalance = 0n;
  let reservedBalance = 0n;

  for (const entry of entries) {
    const amount = entry._sum.amount ?? 0n;
    const signedAmount =
      entry.direction === "CREDIT" ? amount : -amount;

    if (entry.bucket === "AVAILABLE") {
      availableBalance += signedAmount;
    } else {
      reservedBalance += signedAmount;
    }
  }

  return {
    availableBalance,
    reservedBalance,
  };
}

export async function reserveVendorSettlementFunds(
  tx: Prisma.TransactionClient,
  input: TransferVendorLedgerInput,
) {
  if (input.amount <= 0n) {
    throw new Error("INVALID_VENDOR_SETTLEMENT_AMOUNT");
  }

  if (!input.settlementId.trim() || !input.reference.trim()) {
    throw new Error("INVALID_VENDOR_SETTLEMENT_REFERENCE");
  }

  const availableDebit = await recordVendorLedgerEntry(tx, {
    businessAccountId: input.businessAccountId,
    settlementId: input.settlementId,
    bucket: "AVAILABLE",
    direction: "DEBIT",
    type: "SETTLEMENT_RESERVE",
    amount: input.amount,
    reference: `${input.reference}:available`,
    description: input.description ?? "Reserve vendor settlement funds",
  });

  const reservedCredit = await recordVendorLedgerEntry(tx, {
    businessAccountId: input.businessAccountId,
    settlementId: input.settlementId,
    bucket: "RESERVED",
    direction: "CREDIT",
    type: "SETTLEMENT_RESERVE",
    amount: input.amount,
    reference: `${input.reference}:reserved`,
    description: input.description ?? "Reserve vendor settlement funds",
  });

  return { availableDebit, reservedCredit };
}

export async function releaseVendorSettlementFunds(
  tx: Prisma.TransactionClient,
  input: TransferVendorLedgerInput,
) {
  if (input.amount <= 0n) {
    throw new Error("INVALID_VENDOR_SETTLEMENT_AMOUNT");
  }

  if (!input.settlementId.trim() || !input.reference.trim()) {
    throw new Error("INVALID_VENDOR_SETTLEMENT_REFERENCE");
  }

  const reservedDebit = await recordVendorLedgerEntry(tx, {
    businessAccountId: input.businessAccountId,
    settlementId: input.settlementId,
    bucket: "RESERVED",
    direction: "DEBIT",
    type: "SETTLEMENT_RELEASE",
    amount: input.amount,
    reference: `${input.reference}:reserved`,
    description: input.description ?? "Release vendor settlement funds",
  });

  const availableCredit = await recordVendorLedgerEntry(tx, {
    businessAccountId: input.businessAccountId,
    settlementId: input.settlementId,
    bucket: "AVAILABLE",
    direction: "CREDIT",
    type: "SETTLEMENT_RELEASE",
    amount: input.amount,
    reference: `${input.reference}:available`,
    description: input.description ?? "Release vendor settlement funds",
  });

  return { reservedDebit, availableCredit };
}

export async function recordVendorSettlementPayout(
  tx: Prisma.TransactionClient,
  input: TransferVendorLedgerInput,
) {
  if (input.amount <= 0n) {
    throw new Error("INVALID_VENDOR_SETTLEMENT_AMOUNT");
  }

  if (!input.settlementId.trim() || !input.reference.trim()) {
    throw new Error("INVALID_VENDOR_SETTLEMENT_REFERENCE");
  }

  return recordVendorLedgerEntry(tx, {
    businessAccountId: input.businessAccountId,
    settlementId: input.settlementId,
    bucket: "RESERVED",
    direction: "DEBIT",
    type: "SETTLEMENT_PAYOUT",
    amount: input.amount,
    reference: input.reference,
    description: input.description ?? "Record successful vendor settlement payout",
  });
}