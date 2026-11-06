
import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must contain at least 2 characters.")
    .max(150, "Product name cannot exceed 150 characters."),

  description: z
    .string()
    .trim()
    .max(2000, "Product description cannot exceed 2000 characters.")
    .optional(),

  sku: z
    .string()
    .trim()
    .min(1, "Product SKU cannot be empty.")
    .max(100, "Product SKU cannot exceed 100 characters."),

  price: z
    .number()
    .int("Product price must be a whole number in kobo.")
    .positive("Product price must be greater than zero.")
    .max(
      Number.MAX_SAFE_INTEGER,
      "Product price is too large.",
    ),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-character code.")
    .transform((value) => value.toUpperCase())
    .optional(),
});

export type CreateProductInput = z.infer<
  typeof createProductSchema
>;