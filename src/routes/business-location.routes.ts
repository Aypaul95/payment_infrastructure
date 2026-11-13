import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getBusinessPickupLocation,
  updateBusinessPickupLocation,
} from "../services/business-location.service";
import { updateBusinessPickupLocationSchema } from "../validators/business-location.validator";

export const businessLocationRouter = Router();

businessLocationRouter.use(authenticate);

// Retrieve the authenticated business's pickup location
businessLocationRouter.get("/pickup-location", async (req, res) => {
  try {
    const location = await getBusinessPickupLocation(
      req.auth!.businessAccountId,
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Business account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Failed to retrieve business pickup location:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve business pickup location.",
    });
  }
});

// Create or update the authenticated business's pickup location
businessLocationRouter.patch("/pickup-location", async (req, res) => {
  const validation = updateBusinessPickupLocationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid business pickup location data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await updateBusinessPickupLocation(
      req.auth!.businessAccountId,
      validation.data,
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Business account not found.",
      });
    }

    const location = await getBusinessPickupLocation(
      req.auth!.businessAccountId,
    );

    return res.status(200).json({
      success: true,
      message: "Business pickup location updated successfully.",
      data: location,
    });
  } catch (error) {
    console.error("Failed to update business pickup location:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update business pickup location.",
    });
  }
});