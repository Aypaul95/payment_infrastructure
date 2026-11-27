import { z } from "zod";

export const addVendorBankAccountSchema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/),
  bankCode: z.string().trim().min(1),
  bankName: z.string().trim().min(1),
  setAsDefault: z.boolean().optional(),
});

export const createVendorSettlementSchema = z.object({
  bankAccountId: z.string().trim().min(1),
  amount: z.string().regex(/^[1-9]\d*$/),
  idempotencyKey: z.string().trim().min(1).max(255),
});

export const setDefaultVendorBankAccountSchema = z.object({
  bankAccountId: z.string().trim().min(1),
});