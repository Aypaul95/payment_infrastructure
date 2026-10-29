
import { Router } from "express";
import { Prisma } from "../generated/prisma/client";
import { authenticate } from "../middleware/auth.middleware";
import {
  createCustomer,
  listCustomers,
  getCustomerById,
} from "../services/customer.service";
import { createCustomerSchema } from "../validators/customer.validator";

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.post("/", async (req, res) => {
  const validation = createCustomerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const customer = await createCustomer(
      req.auth!.businessAccountId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: customer,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "This customer reference already exists for your business.",
      });
    }

    console.error("Failed to create customer:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create customer.",
    });
  }
});

customerRouter.get("/", async (req, res) => {
  try {
    const customers = await listCustomers(req.auth!.businessAccountId);

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Failed to retrieve customers:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customers.",
    });
  }
});


customerRouter.get("/:id", async (req, res) => {
  const customerId = req.params.id;

  try {
    const customer = await getCustomerById(
      req.auth!.businessAccountId,
      customerId,
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Failed to retrieve customer:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customer.",
    });
  }
});
