import { Prisma } from "../generated/prisma/client";
import { Router } from "express";
import {
  registerRider,
  loginRider,
} from "../services/rider.service";
import {
  registerRiderSchema,
  loginRiderSchema,
} from "../validators/rider.validator";
import {
  createRiderVehicle,
  listRiderVehicles,
  getRiderVehicle,
  updateRiderVehicle,
  deactivateRiderVehicle,
} from "../services/rider-vehicle.service";
import {
  createRiderVehicleSchema,
  updateRiderVehicleSchema,
} from "../validators/rider-vehicle.validator";
import { authenticateRider } from "../middleware/rider-auth.middleware";
import { riderAuthRateLimiter } from "../middleware/rider-auth-rate-limit.middleware";
import { prisma } from "../lib/prisma";
import { riderKycUpload } from "../middleware/rider-kyc-upload.middleware";
import {
  createRiderKycSubmission,
  listRiderKycSubmissions,
} from "../services/rider-kyc.service";
import { createRiderKycSubmissionSchema } from "../validators/rider-kyc.validator";
import multer from "multer";

export const riderRouter = Router();

riderRouter.post("/register", riderAuthRateLimiter, async (req, res) => {
  const validation = registerRiderSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid rider registration data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await registerRider(validation.data);

    return res.status(201).json({
      success: true,
      message: "Rider registered successfully. Your account is awaiting approval.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "RIDER_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "A rider account with this phone number or email already exists.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_PHONE_NUMBER"
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Nigerian phone number.",
      });
    }

    console.error("Rider registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register rider.",
    });
  }
});

riderRouter.post("/login", riderAuthRateLimiter, async (req, res) => {
  const validation = loginRiderSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid rider login data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await loginRider(validation.data);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "RIDER_ACCOUNT_DISABLED"
    ) {
      return res.status(403).json({
        success: false,
        message: "This rider account is disabled.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_PHONE_NUMBER"
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Nigerian phone number.",
      });
    }

    console.error("Rider login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
});

riderRouter.get("/me", authenticateRider, async (req, res) => {
  try {
    const rider = await prisma.rider.findUnique({
      where: {
        id: req.riderAuth!.riderId,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        approvalStatus: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!rider || !rider.isActive) {
      return res.status(403).json({
        success: false,
        message: "This rider account is unavailable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rider,
    });
  } catch (error) {
    console.error("Failed to retrieve rider profile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve rider profile.",
    });
  }
});


riderRouter.post("/vehicles", authenticateRider, async (req, res) => {
  const validation = createRiderVehicleSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const vehicle = await createRiderVehicle(
      req.riderAuth!.riderId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Vehicle registered successfully.",
      data: vehicle,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "VEHICLE_REGISTRATION_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "A vehicle with this registration number already exists.",
      });
    }

    console.error("Vehicle registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register vehicle.",
    });
  }
});

riderRouter.get("/vehicles", authenticateRider, async (req, res) => {
  try {
    const vehicles = await listRiderVehicles(
      req.riderAuth!.riderId,
    );

    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error("Failed to retrieve rider vehicles:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve vehicles.",
    });
  }
});

riderRouter.get("/vehicles/:id", authenticateRider, async (req, res) => {
  try {
    const vehicle = await getRiderVehicle(
      req.riderAuth!.riderId,
      req.params.id as string,
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Failed to retrieve vehicle:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve vehicle.",
    });
  }
});

riderRouter.patch("/vehicles/:id", authenticateRider, async (req, res) => {
  const validation = updateRiderVehicleSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle update data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (Object.keys(validation.data).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide at least one vehicle field to update.",
    });
  }

  try {
    const vehicle = await updateRiderVehicle(
      req.riderAuth!.riderId,
      req.params.id as string,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      data: vehicle,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "VEHICLE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or already deactivated.",
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "A vehicle with this registration number already exists.",
      });
    }

    console.error("Vehicle update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle.",
    });
  }
});

riderRouter.patch(
  "/vehicles/:id/deactivate",
  authenticateRider,
  async (req, res) => {
    try {
      const vehicle = await deactivateRiderVehicle(
        req.riderAuth!.riderId,
        req.params.id as string,
      );

      return res.status(200).json({
        success: true,
        message: "Vehicle deactivated successfully.",
        data: vehicle,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "VEHICLE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found or already deactivated.",
        });
      }

      console.error("Vehicle deactivation failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to deactivate vehicle.",
      });
    }
  },
);


riderRouter.post(
  "/kyc/submissions",
  authenticateRider,
  (req, res, next) => {
    riderKycUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

        return res.status(status).json({
          success: false,
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "KYC document must not exceed 5 MB."
              : "Invalid KYC upload request.",
        });
      }

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Unable to process KYC document upload.",
        });
      }

      return next();
    });
  },
  async (req, res) => {
    const validation = createRiderKycSubmissionSchema.safeParse(
      req.body,
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC document type.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A KYC document file is required.",
      });
    }

    try {
      const submission = await createRiderKycSubmission(
        req.riderAuth!.riderId,
        validation.data,
        req.file.buffer,
      );

      return res.status(201).json({
        success: true,
        message: "KYC document submitted successfully.",
        data: submission,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "UNSUPPORTED_KYC_FILE_TYPE"
      ) {
        return res.status(400).json({
          success: false,
          message: "Only PDF, JPEG, and PNG documents are accepted.",
        });
      }

      if (
        error instanceof Error &&
        error.message === "INVALID_KYC_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message: "The uploaded document is empty or exceeds 5 MB.",
        });
      }

      console.error("KYC document submission failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to submit KYC document.",
      });
    }
  },
);

riderRouter.get(
  "/kyc/submissions",
  authenticateRider,
  async (req, res) => {
    try {
      const submissions = await listRiderKycSubmissions(
        req.riderAuth!.riderId,
      );

      return res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error) {
      console.error("Failed to retrieve rider KYC submissions:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve KYC submissions.",
      });
    }
  },
);
