import type { Request, Response, NextFunction } from "express";

export function requireBusinessOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.auth) {
    res.status(401).json({
      success: false,
      message: "Authentication is required.",
    });
    return;
  }

  if (req.auth.role !== "OWNER") {
    res.status(403).json({
      success: false,
      message: "Only business owners can access vendor financial operations.",
    });
    return;
  }

  next();
}