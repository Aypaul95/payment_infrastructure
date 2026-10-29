
import { z } from "zod";

export const createBusinessAccountSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must contain at least 2 characters.")
    .max(150, "Business name cannot exceed 150 characters."),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email address is too long.")
    .transform((value) => value.toLowerCase()),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short.")
    .max(20, "Phone number is too long.")
    .optional(),
});

export type CreateBusinessAccountInput = z.infer<
  typeof createBusinessAccountSchema
>;
