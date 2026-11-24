
type PaystackResolveAccountResponse = {
  status: boolean;
  message?: string;
  data?: {
    account_number?: string;
    account_name?: string;
    bank_id?: number;
  };
};

export async function resolvePaystackBankAccount(
  accountNumber: string,
  bankCode: string,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const baseUrl =
    process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY_NOT_CONFIGURED");
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    throw new Error("INVALID_BANK_ACCOUNT_NUMBER");
  }

  if (!bankCode.trim()) {
    throw new Error("BANK_CODE_REQUIRED");
  }

  let response: Response;

  try {
    const params = new URLSearchParams({
      account_number: accountNumber,
      bank_code: bankCode.trim(),
    });

    response = await fetch(
      `${baseUrl}/bank/resolve?${params.toString()}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("PAYSTACK_REQUEST_TIMEOUT");
    }

    throw new Error("PAYSTACK_ACCOUNT_RESOLUTION_FAILED");
  }

  let result: PaystackResolveAccountResponse;

  try {
    result = (await response.json()) as PaystackResolveAccountResponse;
  } catch {
    throw new Error("INVALID_PAYSTACK_RESPONSE");
  }

  if (
    !response.ok ||
    result.status !== true ||
    !result.data?.account_name ||
    result.data.account_number !== accountNumber
  ) {
    throw new Error("PAYSTACK_ACCOUNT_RESOLUTION_FAILED");
  }

  return {
    accountName: result.data.account_name,
    accountNumber: result.data.account_number,
  };
}


type PaystackRecipientResponse = {
  status: boolean;
  message?: string;
  data?: {
    recipient_code?: string;
    type?: string;
    name?: string;
    details?: {
      account_number?: string;
      bank_code?: string;
    };
  };
};

type CreatePaystackRecipientInput = {
  accountName: string;
  accountNumber: string;
  bankCode: string;
};

export async function createPaystackTransferRecipient(
  input: CreatePaystackRecipientInput,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const baseUrl =
    process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY_NOT_CONFIGURED");
  }

  if (!input.accountName.trim()) {
    throw new Error("BANK_ACCOUNT_NAME_REQUIRED");
  }

  if (!/^\d{10}$/.test(input.accountNumber)) {
    throw new Error("INVALID_BANK_ACCOUNT_NUMBER");
  }

  if (!input.bankCode.trim()) {
    throw new Error("BANK_CODE_REQUIRED");
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/transferrecipient`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: input.accountName.trim(),
        account_number: input.accountNumber,
        bank_code: input.bankCode.trim(),
        currency: "NGN",
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("PAYSTACK_REQUEST_TIMEOUT");
    }

    throw new Error("PAYSTACK_RECIPIENT_CREATION_FAILED");
  }

  let result: PaystackRecipientResponse;

  try {
    result = (await response.json()) as PaystackRecipientResponse;
  } catch {
    throw new Error("INVALID_PAYSTACK_RESPONSE");
  }

  const recipient = result.data;

  if (
    !response.ok ||
    result.status !== true ||
    !recipient?.recipient_code ||
    recipient.type !== "nuban" ||
    recipient.details?.account_number !== input.accountNumber ||
    recipient.details?.bank_code !== input.bankCode.trim()
  ) {
    throw new Error("PAYSTACK_RECIPIENT_CREATION_FAILED");
  }

  return {
    recipientCode: recipient.recipient_code,
    accountName: recipient.name ?? input.accountName.trim(),
  };
}


type PaystackInitiateTransferResponse = {
  status: boolean;
  message?: string;
  data?: {
    transfer_code?: string;
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
};

type InitiatePaystackTransferInput = {
  recipientCode: string;
  amountKobo: bigint;
  reference: string;
  reason: string;
};

export async function initiatePaystackTransfer(
  input: InitiatePaystackTransferInput,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const baseUrl =
    process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY_NOT_CONFIGURED");
  }

  if (!input.recipientCode.trim()) {
    throw new Error("PAYSTACK_RECIPIENT_CODE_REQUIRED");
  }

  if (input.amountKobo <= 0n) {
    throw new Error("INVALID_TRANSFER_AMOUNT");
  }

  if (input.amountKobo > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("TRANSFER_AMOUNT_TOO_LARGE");
  }

  if (!input.reference.trim()) {
    throw new Error("TRANSFER_REFERENCE_REQUIRED");
  }

  if (!input.reason.trim()) {
    throw new Error("TRANSFER_REASON_REQUIRED");
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/transfer`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: Number(input.amountKobo),
        recipient: input.recipientCode,
        reference: input.reference,
        reason: input.reason.trim(),
        currency: "NGN",
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("PAYSTACK_REQUEST_TIMEOUT");
    }

    throw new Error("PAYSTACK_TRANSFER_INITIATION_FAILED");
  }

  let result: PaystackInitiateTransferResponse;

  try {
    result = (await response.json()) as PaystackInitiateTransferResponse;
  } catch {
    throw new Error("INVALID_PAYSTACK_RESPONSE");
  }

  const transfer = result.data;

  if (
    !response.ok ||
    result.status !== true ||
    !transfer?.transfer_code ||
    transfer.reference !== input.reference ||
    transfer.amount !== Number(input.amountKobo) ||
    transfer.currency !== "NGN" ||
    typeof transfer.status !== "string"
  ) {
    throw new Error("PAYSTACK_TRANSFER_INITIATION_FAILED");
  }

  return {
    transferCode: transfer.transfer_code,
    reference: transfer.reference,
    status: transfer.status,
    amount: BigInt(transfer.amount),
    currency: transfer.currency,
  };
}


type PaystackVerifyTransferResponse = {
  status: boolean;
  message?: string;
  data?: {
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    transfer_code?: string;
  };
};

export async function verifyPaystackTransfer(
  reference: string,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const baseUrl =
    process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY_NOT_CONFIGURED");
  }

  if (!reference.trim()) {
    throw new Error("TRANSFER_REFERENCE_REQUIRED");
  }

  let response: Response;

  try {
    response = await fetch(
      `${baseUrl}/transfer/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("PAYSTACK_REQUEST_TIMEOUT");
    }

    throw new Error("PAYSTACK_TRANSFER_VERIFICATION_FAILED");
  }

  let result: PaystackVerifyTransferResponse;

  try {
    result = (await response.json()) as PaystackVerifyTransferResponse;
  } catch {
    throw new Error("INVALID_PAYSTACK_RESPONSE");
  }

  const transfer = result.data;

  if (
    !response.ok ||
    result.status !== true ||
    !transfer ||
    transfer.reference !== reference ||
    typeof transfer.amount !== "number" ||
    !Number.isSafeInteger(transfer.amount) ||
    typeof transfer.currency !== "string" ||
    typeof transfer.status !== "string" ||
    typeof transfer.transfer_code !== "string"
  ) {
    throw new Error("PAYSTACK_TRANSFER_VERIFICATION_FAILED");
  }

  return {
    reference: transfer.reference,
    amount: BigInt(transfer.amount),
    currency: transfer.currency,
    status: transfer.status,
    transferCode: transfer.transfer_code,
  };
}
