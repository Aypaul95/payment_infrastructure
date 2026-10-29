
import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Customer name must contain at least 2 characters.")
    .max(150, "Customer name cannot exceed 150 characters."),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email address is too long.")
    .transform((value) => value.toLowerCase())
    .optional(),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short.")
    .max(20, "Phone number cannot exceed 20 characters.")
    .optional(),

  reference: z
    .string()
    .trim()
    .min(1, "Customer reference cannot be empty.")
    .max(100, "Customer reference cannot exceed 100 characters.")
    .optional(),
});

export type CreateCustomerInput = z.infer<
  typeof createCustomerSchema
>;
