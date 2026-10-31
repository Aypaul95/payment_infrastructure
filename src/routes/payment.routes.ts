
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import {
    initializePaystackTransaction,
} from "../services/paystack.service";
import {
  createPayment,
  listPayments,
  getPaymentById,
} from "../services/payment.service";
import { createPaymentSchema , initializePaystackSchema,} from "../validators/payment.validator";
import { confirmPayment } from "../services/payment-confirmation.service";

export const paymentRouter = Router();

paymentRouter.use(authenticate);

// Create a payment record.
paymentRouter.post("/", async (req, res) => {
  const validation = createPaymentSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const payment = await createPayment(
      req.auth!.businessAccountId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Payment record created successfully.",
      data: {
        ...payment,
        amount: payment.amount.toString(),
      },
    });
  } catch (error) {
    if (
  error instanceof Error &&
  error.message === "IDEMPOTENCY_KEY_REUSED"
) {
  return res.status(409).json({
    success: false,
    message:
      "This idempotency key has already been used with different payment details.",
  });
}
    if (
      error instanceof Error &&
      error.message === "CUSTOMER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    console.error("Failed to create payment:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment record.",
    });
  }
});

// List payments belonging to the authenticated business.
paymentRouter.get("/", async (req, res) => {
  try {
    const payments = await listPayments(
      req.auth!.businessAccountId,
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toString(),
      })),
    });
  } catch (error) {
    console.error("Failed to retrieve payments:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payments.",
    });
  }
});

// Retrieve one payment belonging to the authenticated business.
paymentRouter.get("/:id", async (req, res) => {
  const paymentId = req.params.id;

  try {
    const payment = await getPaymentById(
      req.auth!.businessAccountId,
      paymentId,
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...payment,
        amount: payment.amount.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve payment:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payment.",
    });
  }
});


paymentRouter.post("/:id/initialize", async (req, res) => {
  const validation = initializePaystackSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "A valid payer email is required.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const businessAccountId = req.auth!.businessAccountId;
    const paymentId = req.params.id;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        businessAccountId,
      },
      select: {
        id: true,
        businessAccountId: true,
        customerId: true,
        reference: true,
        amount: true,
        currency: true,
        status: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    if (payment.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Only pending payments can be initialized.",
      });
    }

    const result = await initializePaystackTransaction({
      email: validation.data.email,
      amount: payment.amount.toString(),
      currency: payment.currency,
      reference: payment.reference,
      paymentId: payment.id,
      businessAccountId: payment.businessAccountId,
    });

    return res.status(200).json({
      success: true,
      message: "Paystack checkout initialized successfully.",
      data: result,
    });
  }
  catch (error) {
      if (
          error instanceof Error &&
          error.message === "PAYSTACK_SECRET_KEY_NOT_CONFIGURED"
      ) {
          return res.status(500).json({
              success: false,
              message: "Payment provider is not configured.",
          });
      }

      if (
          error instanceof Error &&
          [
              "PAYSTACK_INITIALIZATION_FAILED",
              "PAYSTACK_REQUEST_TIMEOUT",
              "INVALID_PAYSTACK_RESPONSE",
          ].includes(error.message)
      ) {
          console.error("Paystack initialization failed:", error);

          return res.status(502).json({
              success: false,
              message:
                  error.message === "PAYSTACK_REQUEST_TIMEOUT"
                      ? "Payment provider request timed out. Please try again."
                      : "Unable to initialize checkout with the payment provider.",
          });
      }

      console.error("Paystack initialization failed:", error);

      return res.status(500).json({
          success: false,
          message: "Unable to initialize payment checkout.",
      });
  }

});

paymentRouter.post("/:id/verify", async (req, res) => {
    const businessAccountId = req.auth!.businessAccountId;
    const paymentId = req.params.id;

    try {
        // Retrieve the payment within the authenticated business.
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                businessAccountId,
            },
            select: {
                reference: true,
            },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found.",
            });
        }

        // Delegate confirmation to the shared service.
        const result = await confirmPayment(
            payment.reference,
            businessAccountId,
        );

        switch (result.outcome) {
            case "SUCCESSFUL":
                return res.status(200).json({
                    success: true,
                    message: "Payment verified successfully.",
                    data: {
                        paymentId: result.paymentId,
                        reference: result.reference,
                        status: "SUCCESSFUL",
                    },
                });

            case "PENDING":
                return res.status(200).json({
                    success: true,
                    message: "Payment has not been confirmed as successful.",
                    data: {
                        paymentId: result.paymentId,
                        reference: result.reference,
                        status: "PENDING",
                        providerStatus: result.providerStatus,
                    },
                });

            case "NOT_FOUND":
                return res.status(404).json({
                    success: false,
                    message: "Payment not found.",
                });

            case "DETAILS_MISMATCH":
                return res.status(409).json({
                    success: false,
                    message: "Paystack transaction details do not match this payment.",
                });

            case "NOT_PENDING":
                return res.status(409).json({
                    success: false,
                    message: "This payment is no longer pending.",
                    data: {
                        paymentId: result.paymentId,
                        reference: result.reference,
                        status: result.currentStatus,
                    },
                });
        }
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "PAYSTACK_SECRET_KEY_NOT_CONFIGURED"
        ) {
            return res.status(500).json({
                success: false,
                message: "Payment provider is not configured.",
            });
        }

        if (
            error instanceof Error &&
            [
                "PAYSTACK_VERIFICATION_FAILED",
                "PAYSTACK_REQUEST_TIMEOUT",
                "INVALID_PAYSTACK_RESPONSE",
            ].includes(error.message)
        ) {
            console.error("Paystack verification failed:", error);

            return res.status(502).json({
                success: false,
                message:
                    error.message === "PAYSTACK_REQUEST_TIMEOUT"
                        ? "Payment provider request timed out. Please try verification again."
                        : "Unable to verify the transaction with Paystack.",
            });
        }

        console.error("Payment verification failed:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify payment.",
        });
    }
});


/**
 * LOCAL DEVELOPMENT ONLY.
 * Do not expose client-supplied payment status updates in production.
 */


// Payment status updates are disabled until verified
// payment-provider notifications are implemented.
paymentRouter.patch("/:id/status", (_req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Direct payment status updates are disabled. Payment outcomes must be confirmed by a trusted payment provider.",
  });
});