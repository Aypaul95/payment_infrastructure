import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { BusinessUserRole } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

export interface AuthenticatedUser {
  userId: string;
  businessAccountId: string;
  role: BusinessUserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET!, {
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      !payload.sub ||
      typeof payload.businessAccountId !== "string" ||
      !Object.values(BusinessUserRole).includes(
        payload.role as BusinessUserRole,
      )
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    const user = await prisma.businessUser.findFirst({
      where: {
        id: payload.sub,
        businessAccountId: payload.businessAccountId,
        isActive: true,
        businessAccount: {
          isActive: true,
        },
      },
      select: {
        id: true,
        businessAccountId: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Account is inactive or no longer available.",
      });
      return;
    }

    req.auth = {
      userId: user.id,
      businessAccountId: user.businessAccountId,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}