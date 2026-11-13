import { z } from "zod";

export const updateBusinessPickupLocationSchema = z.object({
  pickupStreetAddress: z
    .string()
    .trim()
    .min(5, "Pickup street address must contain at least 5 characters.")
    .max(255, "Pickup street address cannot exceed 255 characters."),

  pickupCity: z
    .string()
    .trim()
    .min(2, "Pickup city must contain at least 2 characters.")
    .max(100, "Pickup city cannot exceed 100 characters."),

  pickupState: z
    .string()
    .trim()
    .min(2, "Pickup state must contain at least 2 characters.")
    .max(100, "Pickup state cannot exceed 100 characters."),

  pickupLandmark: z
    .string()
    .trim()
    .max(255, "Pickup landmark cannot exceed 255 characters.")
    .optional(),

  pickupLatitude: z
    .number()
    .finite()
    .min(-90, "Latitude cannot be below -90.")
    .max(90, "Latitude cannot exceed 90."),

  pickupLongitude: z
    .number()
    .finite()
    .min(-180, "Longitude cannot be below -180.")
    .max(180, "Longitude cannot exceed 180."),
});

export type UpdateBusinessPickupLocationInput = z.infer<
  typeof updateBusinessPickupLocationSchema
>;