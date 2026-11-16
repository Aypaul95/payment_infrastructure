import { z } from "zod";

export const assignDeliverySchema = z.object({
  riderId: z
    .string()
    .trim()
    .min(1, "Rider ID is required.")
    .max(100, "Rider ID is too long."),

  reason: z
    .string()
    .trim()
    .min(1, "Reason cannot be empty.")
    .max(500, "Reason cannot exceed 500 characters.")
    .optional(),
});

export type AssignDeliveryInput = z.infer<typeof assignDeliverySchema>;
