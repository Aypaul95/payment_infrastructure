
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getInventory,
  listInventory,
  stockIn,
  stockOut,
  getInventoryMovements,
} from "../services/inventory.service";
import { stockMovementSchema } from "../validators/inventory.validator";

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.get("/", async (req, res) => {
  try {
    const inventory = await listInventory(
      req.auth!.businessAccountId,
    );

    return res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    console.error("Failed to retrieve inventory:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve inventory.",
    });
  }
});

inventoryRouter.get("/:productId", async (req, res) => {
  try {
    const inventory = await getInventory(
      req.auth!.businessAccountId,
      req.params.productId,
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("Failed to retrieve inventory:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve inventory.",
    });
  }
});

inventoryRouter.post("/:productId/stock-in", async (req, res) => {
  const validation = stockMovementSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid stock movement data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const inventory = await stockIn(
      req.auth!.businessAccountId,
      req.params.productId,
      validation.data,
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stock added successfully.",
      data: inventory,
    });
  } catch (error) {
    console.error("Failed to add stock:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add stock.",
    });
  }
});

inventoryRouter.post("/:productId/stock-out", async (req, res) => {
  const validation = stockMovementSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid stock movement data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const inventory = await stockOut(
      req.auth!.businessAccountId,
      req.params.productId,
      validation.data,
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if ("insufficientStock" in inventory) {
      return res.status(409).json({
        success: false,
        message: "Insufficient stock.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stock removed successfully.",
      data: inventory,
    });
  } catch (error) {
    console.error("Failed to remove stock:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove stock.",
    });
  }
});

inventoryRouter.get("/:productId/movements", async (req, res) => {
  try {
    const movements = await getInventoryMovements(
      req.auth!.businessAccountId,
      req.params.productId,
    );

    if (!movements) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      count: movements.length,
      data: movements,
    });
  } catch (error) {
    console.error("Failed to retrieve inventory movements:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve inventory movements.",
    });
  }
});
