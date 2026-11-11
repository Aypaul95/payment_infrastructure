
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

export interface AuthenticatedRider {
  riderId: string;
}

declare global {
  namespace Express {
    interface Request {
      riderAuth?: AuthenticatedRider;
    }
  }
}

export async function authenticateRider(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET!, {
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.accountType !== "RIDER"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const rider = await prisma.rider.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!rider || !rider.isActive) {
      return res.status(401).json({
        success: false,
        message: "Rider account is unavailable.",
      });
    }

    req.riderAuth = {
      riderId: rider.id,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    console.error("Rider authentication failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate rider.",
    });
  }
}
