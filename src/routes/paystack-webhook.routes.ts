import { Router, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../lib/prisma";
import { confirmPayment } from "../services/payment-confirmation.service";

export const paystackWebhookRouter = Router();

paystackWebhookRouter.post(
  "/",
  async (req: Request, res: Response) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.header("x-paystack-signature");

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: "Payment provider is not configured.",
      });
    }

    if (!signature || !Buffer.isBuffer(req.body)) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const expectedSignature = createHmac("sha512", secretKey)
      .update(req.body)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer) ||
      receivedBuffer.toString("hex") !== signature.toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    let event: {
      event?: string;
      data?: {
        reference?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };

    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook payload.",
      });
    }

    if (event.event !== "charge.success") {
      return res.status(200).json({
        success: true,
        message: "Event acknowledged.",
      });
    }

    const data = event.data;

      if (
          !data ||
          typeof data.reference !== "string" ||
          data.reference.trim().length === 0 ||
          data.reference !== data.reference.trim() ||
          typeof data.amount !== "number" ||
          !Number.isSafeInteger(data.amount) ||
          data.amount <= 0 ||
          typeof data.currency !== "string" ||
          data.currency.trim().length === 0 ||
          data.currency !== data.currency.trim() ||
          data.status !== "success"
      )   {
      return res.status(400).json({
        success: false,
        message: "Invalid payment event data.",
      });
    }

        try {
            // 1. Find the payment associated with the webhook reference.
            const payment = await prisma.payment.findUnique({
                where: { reference: data.reference },
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                },
            });

            if (!payment) {
                return res.status(200).json({
                    success: true,
                    message: "Event acknowledged.",
                });
            }

            // 2. Compare the signed webhook details with our database.
            if (
                payment.amount !== BigInt(data.amount) ||
                payment.currency !== data.currency
            ) {
                console.error(
                    "Paystack webhook payment details did not match:",
                    data.reference,
                );

                return res.status(200).json({
                    success: true,
                    message: "Event acknowledged for review.",
                });
            }

            // 3. Independently verify the transaction with Paystack.
            const result = await confirmPayment(data.reference);

            switch (result.outcome) {
                case "SUCCESSFUL":
                    return res.status(200).json({
                        success: true,
                        message: "Payment confirmed.",
                    });

                case "PENDING":
                    return res.status(200).json({
                        success: true,
                        message: "Payment remains pending.",
                    });

                case "NOT_FOUND":
                    return res.status(200).json({
                        success: true,
                        message: "Event acknowledged.",
                    });

                case "DETAILS_MISMATCH":
                    console.error(
                        "Paystack verification details did not match:",
                        data.reference,
                    );

                    return res.status(200).json({
                        success: true,
                        message: "Event acknowledged for review.",
                    });

                case "NOT_PENDING":
                    return res.status(200).json({
                        success: true,
                        message: "Payment status was not changed.",
                    });
            }
        } catch (error) {
            console.error("Paystack webhook processing failed:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to process webhook.",
            });
        }
    },
);