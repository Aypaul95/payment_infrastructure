
import { z } from "zod";

export const createPaymentSchema = z.object({
   idempotencyKey: z
  .string()
  .trim()
  .min(8, "Idempotency key must be at least 8 characters.")
  .max(100, "Idempotency key cannot exceed 100 characters."),
  customerId: z.string().trim().min(1).optional(),

  amount: z
    .string()
    .regex(/^[1-9]\d*$/, "Amount must be a positive whole number in kobo.")
    .refine(
      (value) => {
        try {
          return BigInt(value) <= 9007199254740991n;
        } catch {
          return false;
        }
      },
      "Amount exceeds the supported limit.",
    ),

    currency: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(
      z.literal("NGN", {
        error: "Only NGN currency is currently supported.",
      }),
    )
    .default("NGN"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional(),
});

export type CreatePaymentInput = z.infer<
  typeof createPaymentSchema
>;


export const initializePaystackSchema = z.object({
  email: z.string().trim().email("A valid payer email is required."),
});