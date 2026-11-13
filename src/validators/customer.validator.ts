
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

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  );

export type UpdateCustomerInput = z.infer<
  typeof updateCustomerSchema
>;

export const createCustomerAddressSchema = z.object({
  label: z.enum(["HOME", "OFFICE", "OTHER"]).default("OTHER"),

  recipientName: z
    .string()
    .trim()
    .min(2, "Recipient name must contain at least 2 characters.")
    .max(150, "Recipient name cannot exceed 150 characters."),

  recipientPhone: z
    .string()
    .trim()
    .min(7, "Recipient phone number is too short.")
    .max(20, "Recipient phone number cannot exceed 20 characters."),

  streetAddress: z
    .string()
    .trim()
    .min(5, "Street address must contain at least 5 characters.")
    .max(255, "Street address cannot exceed 255 characters."),

  city: z
    .string()
    .trim()
    .min(2, "City must contain at least 2 characters.")
    .max(100, "City cannot exceed 100 characters."),

  state: z
    .string()
    .trim()
    .min(2, "State must contain at least 2 characters.")
    .max(100, "State cannot exceed 100 characters."),

  landmark: z
    .string()
    .trim()
    .max(255, "Landmark cannot exceed 255 characters.")
    .optional(),

  latitude: z
    .number()
    .finite()
    .min(-90, "Latitude cannot be below -90.")
    .max(90, "Latitude cannot exceed 90."),

  longitude: z
    .number()
    .finite()
    .min(-180, "Longitude cannot be below -180.")
    .max(180, "Longitude cannot exceed 180."),

  isDefault: z.boolean().optional(),
});

export type CreateCustomerAddressInput = z.infer<
  typeof createCustomerAddressSchema
>;

export const updateCustomerAddressSchema =
  createCustomerAddressSchema
    .extend({
      label: z.enum(["HOME", "OFFICE", "OTHER"]).optional(),
    })
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided.",
    );

export type UpdateCustomerAddressInput = z.infer<
  typeof updateCustomerAddressSchema
>;
