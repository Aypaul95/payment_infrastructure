
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createOrder,
  getOrderById,
  listOrders,
} from "../services/order.service";
import { requestDelivery } from "../services/delivery.service";
import { createOrderSchema } from "../validators/order.validator";

export const orderRouter = Router();

orderRouter.use(authenticate);

orderRouter.post("/", async (req, res) => {
  const validation = createOrderSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid order data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const order = await createOrder(
      req.auth!.businessAccountId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: order,
    });
  } catch (error) {
    if (error instanceof Error) {
      const errors: Record<string, { status: number; message: string }> = {
        CUSTOMER_NOT_FOUND: {
          status: 404,
          message: "Customer not found.",
        },
        PRODUCT_NOT_FOUND_OR_INACTIVE: {
          status: 404,
          message: "One or more products were not found or are inactive.",
        },
        BUSINESS_NOT_FOUND: {
          status: 404,
          message: "Business account not found.",
        },
        INSUFFICIENT_STOCK: {
          status: 409,
          message: "Insufficient available stock for one or more products.",
        },
        IDEMPOTENCY_KEY_REUSED: {
          status: 409,
          message: "This idempotency key was already used for a different order.",
        },
        PRODUCT_CURRENCY_MISMATCH: {
          status: 400,
          message: "Product currency does not match the business currency.",
        },
        DISCOUNT_EXCEEDS_SUBTOTAL: {
          status: 400,
          message: "Discount cannot exceed the order subtotal.",
        },
        ORDER_CONCURRENCY_RETRY_EXHAUSTED: {
           status: 503,
           message: "Order processing is temporarily busy. Please retry.",
          },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return res.status(knownError.status).json({
          success: false,
          message: knownError.message,
        });
      }
    }

    console.error("Failed to create order:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create order.",
    });
  }
});

orderRouter.get("/", async (req, res) => {
  try {
    const orders = await listOrders(req.auth!.businessAccountId);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Failed to retrieve orders:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve orders.",
    });
  }
});

orderRouter.post("/:orderId/delivery", async (req, res) => {
  try {
    const delivery = await requestDelivery(
      req.auth!.businessAccountId,
      req.params.orderId,
      req.auth!.userId,
    );

    return res.status(200).json({
      success: true,
      message: "Delivery request processed successfully.",
      data: delivery,
    });
  } catch (error) {
    if (error instanceof Error) {
      const errors: Record<string, { status: number; message: string }> = {
        ORDER_NOT_FOUND: {
          status: 404,
          message: "Order not found.",
        },
        ORDER_NOT_READY_FOR_DELIVERY: {
          status: 409,
          message: "Order is not ready for delivery.",
        },
        BUSINESS_PICKUP_LOCATION_INCOMPLETE: {
          status: 409,
          message: "Complete the business pickup location before requesting delivery.",
        },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return res.status(knownError.status).json({
          success: false,
          message: knownError.message,
        });
      }
    }

    console.error("Failed to request delivery:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to request delivery.",
    });
  }
});

orderRouter.get("/:orderId", async (req, res) => {
  try {
    const order = await getOrderById(
      req.auth!.businessAccountId,
      req.params.orderId,
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Failed to retrieve order:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order.",
    });
  }
});
