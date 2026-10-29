
import express from "express";
import { prisma } from "./lib/prisma";
import { authRouter } from "./routes/auth.routes";
import { authenticate } from "./middleware/auth.middleware";
import { customerRouter } from "./routes/customer.routes";
import { paymentRouter } from "./routes/payment.routes";
import { paystackWebhookRouter } from "./routes/paystack-webhook.routes";
const app = express();
const PORT = 3000;

app.use(
  "/webhooks/paystack",
  express.raw({ type: "application/json", limit: "1mb" }),
  paystackWebhookRouter,
);

app.use(express.json());
app.use("/auth", authRouter);
app.use("/customers", customerRouter);
app.use("/payments", paymentRouter);

// Public health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "payment-infrastructure-api",
    timestamp: new Date().toISOString(),
  });
});

// Retrieve only the authenticated user's business account
app.get("/business-accounts", authenticate, async (req, res) => {
  try {
    const businessAccountId = req.auth!.businessAccountId;

    const account = await prisma.businessAccount.findUnique({
      where: {
        id: businessAccountId,
      },
      select: {
        id: true,
        businessName: true,
        email: true,
        phone: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account || !account.isActive) {
      return res.status(403).json({
        success: false,
        message: "This business account is unavailable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Failed to retrieve business account:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve business account.",
    });
  }
});

// Business registration must go through /auth/register
app.post("/business-accounts", (_req, res) => {
  return res.status(410).json({
    success: false,
    message:
      "This endpoint is no longer available. Use POST /auth/register.",
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Payment Infrastructure API running at http://127.0.0.1:${PORT}`,
  );
});
