import { prisma } from "../lib/prisma";
import { recordRiderWalletTransaction } from "./rider-wallet-ledger.service";

export async function getOrCreateRiderWallet(riderId: string) {
  if (!riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: {
      id: true,
      approvalStatus: true,
      isActive: true,
    },
  });

  if (!rider) {
    throw new Error("RIDER_NOT_FOUND");
  }

  if (
    rider.approvalStatus !== "APPROVED" ||
    !rider.isActive
  ) {
    throw new Error("RIDER_NOT_ELIGIBLE_FOR_WALLET");
  }

  return prisma.riderWallet.upsert({
    where: { riderId },
    create: {
      riderId,
      currency: "NGN",
    },
    update: {},
  });
}

export async function getRiderWalletBalance(riderId: string) {
  if (!riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  const wallet = await prisma.riderWallet.findUnique({
    where: { riderId },
    select: {
      id: true,
      riderId: true,
      availableBalance: true,
      reservedBalance: true,
      currency: true,
      updatedAt: true,
    },
  });

  if (!wallet) {
    throw new Error("RIDER_WALLET_NOT_FOUND");
  }

  return wallet;
}

export async function creditRiderWallet(input: {
  riderId: string;
  amount: bigint;
  reference: string;
  description?: string;
}) {
  if (!input.riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_WALLET_CREDIT_AMOUNT");
  }

  if (!input.reference.trim()) {
    throw new Error("WALLET_CREDIT_REFERENCE_REQUIRED");
  }

  return prisma.$transaction(async (tx) => {
    const rider = await tx.rider.findUnique({
      where: { id: input.riderId },
      select: {
        id: true,
        approvalStatus: true,
        isActive: true,
      },
    });

    if (!rider) {
      throw new Error("RIDER_NOT_FOUND");
    }

    if (
      rider.approvalStatus !== "APPROVED" ||
      !rider.isActive
    ) {
      throw new Error("RIDER_NOT_ELIGIBLE_FOR_WALLET");
    }

    const wallet = await tx.riderWallet.upsert({
      where: { riderId: input.riderId },
      create: {
        riderId: input.riderId,
        currency: "NGN",
      },
      update: {},
    });

    return recordRiderWalletTransaction(tx, {
      walletId: wallet.id,
      type: "CREDIT",
      amount: input.amount,
      reference: input.reference,
      description: input.description,
      currency: wallet.currency,
    });
  });
}

export async function debitRiderWallet(input: {
  riderId: string;
  amount: bigint;
  reference: string;
  description?: string;
}) {
  if (!input.riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_WALLET_DEBIT_AMOUNT");
  }

  if (!input.reference.trim()) {
    throw new Error("WALLET_DEBIT_REFERENCE_REQUIRED");
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.riderWallet.findUnique({
      where: { riderId: input.riderId },
    });

    if (!wallet) {
      throw new Error("RIDER_WALLET_NOT_FOUND");
    }

    return recordRiderWalletTransaction(tx, {
      walletId: wallet.id,
      type: "DEBIT",
      amount: input.amount,
      reference: input.reference,
      description: input.description,
      currency: wallet.currency,
    });
  });
}
export async function reserveRiderWalletFunds(input: {
  riderId: string;
  amount: bigint;
  reference: string;
  description?: string;
}) {
  if (!input.riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_WALLET_RESERVE_AMOUNT");
  }

  if (!input.reference.trim()) {
    throw new Error("WALLET_RESERVE_REFERENCE_REQUIRED");
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.riderWallet.findUnique({
      where: { riderId: input.riderId },
    });

    if (!wallet) {
      throw new Error("RIDER_WALLET_NOT_FOUND");
    }

    return recordRiderWalletTransaction(tx, {
      walletId: wallet.id,
      type: "RESERVE",
      amount: input.amount,
      reference: input.reference,
      description: input.description,
      currency: wallet.currency,
    });
  });
}

export async function releaseRiderWalletFunds(input: {
  riderId: string;
  amount: bigint;
  reference: string;
  description?: string;
}) {
  if (!input.riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_WALLET_RELEASE_AMOUNT");
  }

  if (!input.reference.trim()) {
    throw new Error("WALLET_RELEASE_REFERENCE_REQUIRED");
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.riderWallet.findUnique({
      where: { riderId: input.riderId },
    });

    if (!wallet) {
      throw new Error("RIDER_WALLET_NOT_FOUND");
    }

    return recordRiderWalletTransaction(tx, {
      walletId: wallet.id,
      type: "RELEASE",
      amount: input.amount,
      reference: input.reference,
      description: input.description,
      currency: wallet.currency,
    });
  });
}

export async function payoutRiderWalletFunds(input: {
  riderId: string;
  amount: bigint;
  reference: string;
  description?: string;
}) {
  if (!input.riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (input.amount <= 0n) {
    throw new Error("INVALID_WALLET_PAYOUT_AMOUNT");
  }

  if (!input.reference.trim()) {
    throw new Error("WALLET_PAYOUT_REFERENCE_REQUIRED");
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.riderWallet.findUnique({
      where: { riderId: input.riderId },
    });

    if (!wallet) {
      throw new Error("RIDER_WALLET_NOT_FOUND");
    }

    return recordRiderWalletTransaction(tx, {
      walletId: wallet.id,
      type: "PAYOUT",
      amount: input.amount,
      reference: input.reference,
      description: input.description,
      currency: wallet.currency,
    });
  });
}