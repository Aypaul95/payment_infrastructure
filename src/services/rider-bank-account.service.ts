import { prisma } from "../lib/prisma";
import { encryptBankAccountNumber } from "../lib/bank-account-encryption";
import {
  resolvePaystackBankAccount,
  createPaystackTransferRecipient,
} from "./paystack-transfer.service";

export interface RegisterRiderBankAccountInput {
  riderId: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

function validateBankAccountInput(
  input: RegisterRiderBankAccountInput,
) {
  if (!input.riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (!/^\d{10}$/.test(input.accountNumber)) {
    throw new Error("INVALID_BANK_ACCOUNT_NUMBER");
  }

  if (!input.bankCode.trim()) {
    throw new Error("BANK_CODE_REQUIRED");
  }

  if (!input.bankName.trim()) {
    throw new Error("BANK_NAME_REQUIRED");
  }
}

async function verifyRiderEligibility(riderId: string) {
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
    throw new Error("RIDER_NOT_ELIGIBLE_FOR_BANK_ACCOUNT");
  }

  return rider;
}

export async function registerRiderBankAccount(
  input: RegisterRiderBankAccountInput,
) {
  validateBankAccountInput(input);

  await verifyRiderEligibility(input.riderId);

  const resolvedAccount = await resolvePaystackBankAccount(
    input.accountNumber,
    input.bankCode,
  );

  const recipient = await createPaystackTransferRecipient({
    accountName: resolvedAccount.accountName,
    accountNumber: resolvedAccount.accountNumber,
    bankCode: input.bankCode,
  });

  const encryptedAccountNumber = encryptBankAccountNumber(
    resolvedAccount.accountNumber,
  );

  const maskedAccountNumber =
    `******${resolvedAccount.accountNumber.slice(-4)}`;

  return prisma.riderBankAccount.create({
  data: {
    riderId: input.riderId,
    bankCode: input.bankCode.trim(),
    bankName: input.bankName.trim(),
    encryptedAccountNumber,
    maskedAccountNumber,
    accountName: recipient.accountName,
    recipientCode: recipient.recipientCode,
    status: "VERIFIED",
    verifiedAt: new Date(),
  },
  select: {
    id: true,
    riderId: true,
    bankCode: true,
    bankName: true,
    maskedAccountNumber: true,
    accountName: true,
    status: true,
    verifiedAt: true,
    createdAt: true,
    updatedAt: true,
  },
});
}

export async function getRiderBankAccounts(riderId: string) {
  if (!riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  await verifyRiderEligibility(riderId);

  return prisma.riderBankAccount.findMany({
    where: {
      riderId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      bankCode: true,
      bankName: true,
      maskedAccountNumber: true,
      accountName: true,
      status: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
}

export async function getVerifiedRiderBankAccount(
  riderId: string,
  bankAccountId: string,
) {
  if (!riderId.trim()) {
    throw new Error("RIDER_ID_REQUIRED");
  }

  if (!bankAccountId.trim()) {
    throw new Error("BANK_ACCOUNT_ID_REQUIRED");
  }

  await verifyRiderEligibility(riderId);

  const bankAccount = await prisma.riderBankAccount.findFirst({
    where: {
      id: bankAccountId,
      riderId,
      status: "VERIFIED",
      recipientCode: {
        not: null,
      },
    },
    select: {
      id: true,
      riderId: true,
      bankCode: true,
      bankName: true,
      maskedAccountNumber: true,
      accountName: true,
      recipientCode: true,
      status: true,
    },
  });

  if (!bankAccount) {
    throw new Error("VERIFIED_BANK_ACCOUNT_NOT_FOUND");
  }

  return bankAccount;
}