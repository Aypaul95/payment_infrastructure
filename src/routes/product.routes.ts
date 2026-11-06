
import { Router } from "express";
import { Prisma } from "../generated/prisma/client";
import { authenticate } from "../middleware/auth.middleware";
import {
  createProduct,
  listProducts,
  getProductById,
} from "../services/product.service";
import { createProductSchema } from "../validators/product.validator";

export const productRouter = Router();

productRouter.use(authenticate);

productRouter.post("/", async (req, res) => {
  const validation = createProductSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid product data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const product = await createProduct(
      req.auth!.businessAccountId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "This product SKU already exists for your business.",
      });
    }

    console.error("Failed to create product:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create product.",
    });
  }
});

productRouter.get("/", async (req, res) => {
  try {
    const products = await listProducts(req.auth!.businessAccountId);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Failed to retrieve products:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve products.",
    });
  }
});

productRouter.get("/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await getProductById(
      req.auth!.businessAccountId,
      productId,
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Failed to retrieve product:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve product.",
    });
  }
});