
import { z } from "zod";

export const createRiderVehicleSchema = z.object({
  vehicleType: z.enum([
    "MOTORCYCLE",
    "CAR",
    "VAN",
    "BICYCLE",
  ]),

  make: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  model: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional(),

  color: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .optional(),

  registrationNumber: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .transform((value) => value.toUpperCase())
    .optional(),

  year: z
    .number()
    .int()
    .min(1980)
    .max(new Date().getFullYear() + 1)
    .optional(),
});

export const updateRiderVehicleSchema =
  createRiderVehicleSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided for an update.",
    );

export type CreateRiderVehicleInput = z.infer<
  typeof createRiderVehicleSchema
>;

export type UpdateRiderVehicleInput = z.infer<
  typeof updateRiderVehicleSchema
>;
