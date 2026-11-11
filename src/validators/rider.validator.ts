
import { z } from "zod";

export const registerRiderSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must contain at least 2 characters.")
    .max(100, "Full name cannot exceed 100 characters."),

  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number.")
    .max(20, "Phone number is too long.")
    .regex(
      /^\+?[0-9\s()-]+$/,
      "Phone number contains invalid characters.",
    ),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email address is too long.")
    .transform((value) => value.toLowerCase())
    .optional(),

  password: z
    .string()
    .min(12, "Password must contain at least 12 characters.")
    .max(72, "Password cannot exceed 72 characters."),
});

export const loginRiderSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number.")
    .max(20, "Phone number is too long.")
    .regex(
      /^\+?[0-9\s()-]+$/,
      "Phone number contains invalid characters.",
    ),

  password: z
    .string()
    .min(1, "Password is required.")
    .max(72, "Password is too long."),
});

export type RegisterRiderInput = z.infer<
  typeof registerRiderSchema
>;

export type LoginRiderInput = z.infer<
  typeof loginRiderSchema
>;
