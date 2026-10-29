
import { Router } from "express";
import {
  registerBusiness,
  loginBusiness,
} from "../services/auth.service";
import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator";
import { authenticate } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await registerBusiness(validation.data);

    return res.status(201).json({
      success: true,
      message: "Business registered successfully.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Business registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register the business.",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid login data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await loginBusiness(validation.data);

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
        message: "Invalid email or password.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "ACCOUNT_DISABLED"
    ) {
      return res.status(403).json({
        success: false,
        message: "This account is disabled.",
      });
    }

    console.error("Login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
});

authRouter.get("/me", authenticate, async (req, res) => {
  try {
    const userId = req.auth!.userId;

    const user = await prisma.businessUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        businessAccount: {
          select: {
            id: true,
            businessName: true,
            currency: true,
            isActive: true,
          },
        },
      },
    });

    if (
      !user ||
      !user.isActive ||
      !user.businessAccount.isActive
    ) {
      return res.status(403).json({
        success: false,
        message: "This account is unavailable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Failed to retrieve authenticated profile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your profile.",
    });
  }
});