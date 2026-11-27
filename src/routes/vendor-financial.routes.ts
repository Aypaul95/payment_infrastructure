import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireBusinessOwner } from "../middleware/business-owner.middleware";

import {
  addVendorBankAccount,
  listVendorBankAccounts,
  setDefaultVendorBankAccount,
} from "../services/vendor-bank-account.service";

import {
  createVendorSettlement,
  listVendorSettlements,
  initiateVendorSettlement,
  verifyVendorSettlement,
} from "../services/vendor-settlement.service";

import {
  addVendorBankAccountSchema,
  createVendorSettlementSchema,
  setDefaultVendorBankAccountSchema,
} from "../validators/vendor-financial.validator";

export const vendorFinancialRouter = Router();

vendorFinancialRouter.use(authenticate, requireBusinessOwner);

vendorFinancialRouter.get("/bank-accounts", async (req, res) => {
  try {
    const accounts = await listVendorBankAccounts(
      req.auth!.businessAccountId,
    );

    return res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    console.error("Failed to retrieve vendor bank accounts:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve vendor bank accounts.",
    });
  }
});

vendorFinancialRouter.post("/bank-accounts", async (req, res) => {
  const validation = addVendorBankAccountSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid vendor bank account data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const account = await addVendorBankAccount({
      businessAccountId: req.auth!.businessAccountId,
      ...validation.data,
    });

    return res.status(201).json({
      success: true,
      message: "Vendor bank account registered and verified.",
      data: account,
    });
  } catch (error) {
    console.error("Failed to register vendor bank account:", error);

    return res.status(502).json({
      success: false,
      message: "Unable to register or verify vendor bank account.",
    });
  }
});

vendorFinancialRouter.patch(
  "/bank-accounts/:bankAccountId/default",
  async (req, res) => {
    const validation = setDefaultVendorBankAccountSchema.safeParse({
      bankAccountId: req.params.bankAccountId,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid bank account identifier.",
      });
    }

    try {
      const account = await setDefaultVendorBankAccount(
        req.auth!.businessAccountId,
        validation.data.bankAccountId,
      );

      return res.status(200).json({
        success: true,
        message: "Default vendor bank account updated.",
        data: account,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "VERIFIED_VENDOR_BANK_ACCOUNT_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "Verified vendor bank account not found.",
        });
      }

      console.error("Failed to set default vendor bank account:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update default vendor bank account.",
      });
    }
  },
);

vendorFinancialRouter.post("/settlements", async (req, res) => {
  const validation = createVendorSettlementSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid vendor settlement data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const settlement = await createVendorSettlement({
      businessAccountId: req.auth!.businessAccountId,
      userRole: req.auth!.role,
      bankAccountId: validation.data.bankAccountId,
      amount: BigInt(validation.data.amount),
      idempotencyKey: validation.data.idempotencyKey,
    });

      return res.status(201).json({
          success: true,
          message: "Vendor settlement request created.",
          data: {
              ...settlement,
              amount: settlement.amount.toString(),
          },
      });
  } catch (error) {
    if (error instanceof Error) {
        if (error.message === "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST") {
            return res.status(409).json({
                success: false,
                code: "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST",
                message: "This idempotency key has already been used with different settlement details.",
            });
        }
      if (error.message === "INSUFFICIENT_VENDOR_BALANCE") {
        return res.status(409).json({
          success: false,
          code: "INSUFFICIENT_VENDOR_BALANCE",
          message: "Insufficient available vendor balance.",
        });
      }

      if (error.message === "VERIFIED_VENDOR_BANK_ACCOUNT_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          code: "VERIFIED_VENDOR_BANK_ACCOUNT_NOT_FOUND",
          message: "Verified vendor bank account not found.",
        });
      }
    }

    console.error("Failed to create vendor settlement:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create vendor settlement.",
    });
  }
});

vendorFinancialRouter.get("/settlements", async (req, res) => {
  try {
    const settlements = await listVendorSettlements(
      req.auth!.businessAccountId,
      req.auth!.role,
    );

    return res.status(200).json({
      success: true,
      count: settlements.length,
        data: settlements.map((settlement) => ({
            ...settlement,
            amount: settlement.amount.toString(),
        })),
    });
  } catch (error) {
    console.error("Failed to retrieve vendor settlements:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve vendor settlements.",
    });
  }
});

vendorFinancialRouter.post(
  "/settlements/:settlementId/initiate",
  async (req, res) => {
    try {
      const settlement = await initiateVendorSettlement(
        req.auth!.businessAccountId,
        req.params.settlementId,
        req.auth!.role,
      );

      return res.status(200).json({
        success: true,
        message: "Vendor settlement transfer initiated.",
          data: {
              ...settlement,
              amount: settlement.amount.toString(),
          },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "VENDOR_SETTLEMENT_NOT_PENDING") {
          return res.status(409).json({
            success: false,
            message: "This settlement is not pending initiation.",
          });
        }

        if (error.message === "VENDOR_SETTLEMENT_OWNER_ONLY") {
          return res.status(403).json({
            success: false,
            message: "Only business owners can initiate settlements.",
          });
        }
      }

      console.error("Failed to initiate vendor settlement:", error);

      return res.status(502).json({
        success: false,
        message:
          "Transfer initiation could not be confirmed. Reconcile this settlement before attempting another payout.",
      });
    }
  },
);

vendorFinancialRouter.post(
  "/settlements/:settlementId/verify",
  async (req, res) => {
    try {
      const result = await verifyVendorSettlement(
        req.auth!.businessAccountId,
        req.params.settlementId,
        req.auth!.role,
      );

      return res.status(200).json({
        success: true,
        message: "Vendor settlement verification completed.",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "VENDOR_SETTLEMENT_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            message: "Vendor settlement not found.",
          });
        }

        if (
          error.message ===
          "VENDOR_SETTLEMENT_NOT_AVAILABLE_FOR_VERIFICATION"
        ) {
          return res.status(409).json({
            success: false,
            message: "This settlement cannot be verified in its current state.",
          });
        }

        if (error.message === "PAYSTACK_TRANSFER_DETAILS_MISMATCH") {
          return res.status(409).json({
            success: false,
            message: "Paystack transfer details do not match this settlement.",
          });
        }
      }

      console.error("Failed to verify vendor settlement:", error);

      return res.status(502).json({
        success: false,
        message: "Unable to verify vendor settlement with Paystack.",
      });
    }
  },
);