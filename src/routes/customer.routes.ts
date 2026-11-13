
import { Router } from "express";
import { Prisma } from "../generated/prisma/client";
import { authenticate } from "../middleware/auth.middleware";
import {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerPayments,
} from "../services/customer.service";
import {
  createCustomerAddress,
  listCustomerAddresses,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
} from "../services/customer-address.service";
import { createCustomerSchema, updateCustomerSchema, createCustomerAddressSchema, updateCustomerAddressSchema, } from "../validators/customer.validator";

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

customerRouter.post("/:id/addresses", async (req, res) => {
  const customerId = req.params.id;

  const validation = createCustomerAddressSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer address data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const address = await createCustomerAddress(
      req.auth!.businessAccountId,
      customerId,
      validation.data,
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Customer address created successfully.",
      data: address,
    });
  } catch (error) {
    console.error("Failed to create customer address:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create customer address.",
    });
  }
});

customerRouter.get("/:id/addresses", async (req, res) => {
  const customerId = req.params.id;

  try {
    const addresses = await listCustomerAddresses(
      req.auth!.businessAccountId,
      customerId,
    );

    if (!addresses) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    console.error("Failed to retrieve customer addresses:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customer addresses.",
    });
  }
});

customerRouter.patch("/:id/addresses/:addressId", async (req, res) => {
  const customerId = req.params.id;
  const addressId = req.params.addressId;

  const validation = updateCustomerAddressSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer address update data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const address = await updateCustomerAddress(
      req.auth!.businessAccountId,
      customerId,
      addressId,
      validation.data,
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Customer or address not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer address updated successfully.",
      data: address,
    });
  } catch (error) {
    console.error("Failed to update customer address:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer address.",
    });
  }
});

customerRouter.delete("/:id/addresses/:addressId", async (req, res) => {
  const customerId = req.params.id;
  const addressId = req.params.addressId;

  try {
    const deleted = await deleteCustomerAddress(
      req.auth!.businessAccountId,
      customerId,
      addressId,
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Customer or address not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer address deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete customer address:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete customer address.",
    });
  }
});

customerRouter.patch(
  "/:id/addresses/:addressId/default",
  async (req, res) => {
    const customerId = req.params.id;
    const addressId = req.params.addressId;

    try {
      const address = await setDefaultCustomerAddress(
        req.auth!.businessAccountId,
        customerId,
        addressId,
      );

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Customer or address not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Default customer address updated successfully.",
        data: address,
      });
    } catch (error) {
      console.error("Failed to set default customer address:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to set default customer address.",
      });
    }
  },
);

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


customerRouter.patch("/:id", async (req, res) => {
  const customerId = req.params.id;

  const validation = updateCustomerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer update data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const customer = await updateCustomer(
      req.auth!.businessAccountId,
      customerId,
      validation.data,
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
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

    console.error("Failed to update customer:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer.",
    });
  }
});


customerRouter.delete("/:id", async (req, res) => {
  const customerId = req.params.id;

  try {
    const deleted = await deleteCustomer(
      req.auth!.businessAccountId,
      customerId,
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (deleted === "HAS_PAYMENTS") {
      return res.status(409).json({
        success: false,
        message:
          "This customer cannot be deleted because payment records are associated with them.",
      });
    }

    if (deleted === "HAS_ADDRESSES") {
      return res.status(409).json({
        success: false,
        message:
          "This customer cannot be deleted because saved addresses are associated with them.",
      });
    }

    if (deleted === "HAS_ORDERS") {
      return res.status(409).json({
        success: false,
        message:
          "This customer cannot be deleted because order records are associated with them.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete customer:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete customer.",
    });
  }
});

customerRouter.get("/:id/payments", async (req, res) => {
  const customerId = req.params.id;

  try {
    const payments = await getCustomerPayments(
      req.auth!.businessAccountId,
      customerId,
    );

    if (!payments) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Failed to retrieve customer payments:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customer payments.",
    });
  }
});
