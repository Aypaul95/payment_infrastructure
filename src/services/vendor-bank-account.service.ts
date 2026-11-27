import { prisma } from "../lib/prisma";
import {
  encryptBankAccountNumber,
} from "../lib/bank-account-encryption";
import {
  createPaystackTransferRecipient,
  resolvePaystackBankAccount,
} from "./paystack-transfer.service";

interface AddVendorBankAccountInput {
  businessAccountId: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  setAsDefault?: boolean;
}

function validateBankAccountInput(input: AddVendorBankAccountInput): void {
  if (!input.businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
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

export async function addVendorBankAccount(
  input: AddVendorBankAccountInput,
) {
  validateBankAccountInput(input);

  const resolvedAccount = await resolvePaystackBankAccount(
    input.accountNumber,
    input.bankCode,
  );

  const recipient = await createPaystackTransferRecipient({
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
    accountName: resolvedAccount.accountName,
  });

  const encryptedAccountNumber = encryptBankAccountNumber(
    input.accountNumber,
  );

  const maskedAccountNumber = `******${input.accountNumber.slice(-4)}`;

  return prisma.$transaction(async (tx) => {
    if (input.setAsDefault) {
      await tx.vendorBankAccount.updateMany({
        where: { businessAccountId: input.businessAccountId },
        data: { isDefault: false },
      });
    }

    return tx.vendorBankAccount.create({
      data: {
        businessAccountId: input.businessAccountId,
        bankCode: input.bankCode.trim(),
        bankName: input.bankName.trim(),
        encryptedAccountNumber,
        maskedAccountNumber,
        accountName: recipient.accountName,
        recipientCode: recipient.recipientCode,
        currency: "NGN",
        status: "VERIFIED",
        verifiedAt: new Date(),
        isDefault: input.setAsDefault ?? false,
      },
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        maskedAccountNumber: true,
        accountName: true,
        currency: true,
        status: true,
        verifiedAt: true,
        isDefault: true,
        createdAt: true,
      },
    });
  });
}

export async function listVendorBankAccounts(
  businessAccountId: string,
) {
  if (!businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  return prisma.vendorBankAccount.findMany({
    where: { businessAccountId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      bankCode: true,
      bankName: true,
      maskedAccountNumber: true,
      accountName: true,
      currency: true,
      status: true,
      verifiedAt: true,
      isDefault: true,
      createdAt: true,
    },
  });
}

export async function getVendorBankAccount(
  businessAccountId: string,
  bankAccountId: string,
) {
  if (!businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  if (!bankAccountId.trim()) {
    throw new Error("BANK_ACCOUNT_ID_REQUIRED");
  }

  const bankAccount = await prisma.vendorBankAccount.findFirst({
    where: {
      id: bankAccountId,
      businessAccountId,
    },
    select: {
      id: true,
      bankCode: true,
      bankName: true,
      maskedAccountNumber: true,
      accountName: true,
      currency: true,
      status: true,
      verifiedAt: true,
      isDefault: true,
      createdAt: true,
    },
  });

  if (!bankAccount) {
    throw new Error("VENDOR_BANK_ACCOUNT_NOT_FOUND");
  }

  return bankAccount;
}

export async function setDefaultVendorBankAccount(
  businessAccountId: string,
  bankAccountId: string,
) {
  if (!businessAccountId.trim()) {
    throw new Error("BUSINESS_ACCOUNT_ID_REQUIRED");
  }

  if (!bankAccountId.trim()) {
    throw new Error("BANK_ACCOUNT_ID_REQUIRED");
  }

  return prisma.$transaction(async (tx) => {
    const bankAccount = await tx.vendorBankAccount.findFirst({
      where: {
        id: bankAccountId,
        businessAccountId,
        status: "VERIFIED",
        recipientCode: { not: null },
        currency: "NGN",
      },
      select: { id: true },
    });

    if (!bankAccount) {
      throw new Error("VERIFIED_VENDOR_BANK_ACCOUNT_NOT_FOUND");
    }

    await tx.vendorBankAccount.updateMany({
      where: { businessAccountId },
      data: { isDefault: false },
    });

    return tx.vendorBankAccount.update({
      where: { id: bankAccountId },
      data: { isDefault: true },
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        maskedAccountNumber: true,
        accountName: true,
        currency: true,
        status: true,
        verifiedAt: true,
        isDefault: true,
        createdAt: true,
      },
    });
  });
}