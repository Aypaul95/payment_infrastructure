
import { z } from "zod";

export const createOrderSchema = z.object({
  idempotencyKey: z
    .string()
    .trim()
    .min(8, "Idempotency key must be at least 8 characters.")
    .max(100, "Idempotency key cannot exceed 100 characters."),

  customerId: z.string().trim().min(1, "Customer is required."),

  customerAddressId: z
    .string()
    .trim()
    .min(1, "Delivery address is required."),

  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1, "Product is required."),
        quantity: z
          .number()
          .int("Quantity must be a whole number.")
          .positive("Quantity must be greater than zero.")
          .max(100000, "Quantity exceeds the supported limit."),
      }),
    )
    .min(1, "An order must contain at least one item.")
    .max(100, "An order cannot contain more than 100 items."),

  discount: z
    .string()
    .regex(/^\d+$/, "Discount must be a non-negative whole number in kobo.")
    .refine(
      (value) => {
        try {
          return BigInt(value) <= 9007199254740991n;
        } catch {
          return false;
        }
      },
      "Discount exceeds the supported limit.",
    )
    .default("0"),

  notes: z
    .string()
    .trim()
    .max(500, "Order notes cannot exceed 500 characters.")
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
