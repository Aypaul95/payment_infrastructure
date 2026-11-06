import { z } from "zod";

export const stockMovementSchema = z.object({
  quantity: z
    .number()
    .int()
    .positive()
    .max(1_000_000, "Quantity cannot exceed 1,000,000."),
  reason: z.string().trim().max(255).optional(),
});

export type StockMovementInput = z.infer<
  typeof stockMovementSchema
>;