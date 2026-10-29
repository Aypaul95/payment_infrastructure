function isPaystackTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "TimeoutError"
  );
}

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

type InitializePaystackInput = {
  email: string;
  amount: string;
  currency: string;
  reference: string;
  paymentId: string;
  businessAccountId: string;
};

export async function initializePaystackTransaction(
  input: InitializePaystackInput,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const baseUrl =
    process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY_NOT_CONFIGURED");
  }

  if (!input.email.trim()) {
    throw new Error("CUSTOMER_EMAIL_REQUIRED");
  }
    let response: Response;
    try {
        response = await fetch(
            `${baseUrl}/transaction/initialize`,
            {
                method: "POST",
                signal: AbortSignal.timeout(15000),
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: input.email.trim(),
                    amount: Number(input.amount),
                    currency: input.currency,
                    reference: input.reference,
                    metadata: {
                        paymentId: input.paymentId,
                        businessAccountId: input.businessAccountId,
                    },
                }),
            },
        );
    } catch (error) {
        if (isPaystackTimeout(error)) {
            throw new Error("PAYSTACK_REQUEST_TIMEOUT");
        }

        throw new Error("PAYSTACK_INITIALIZATION_FAILED");
    }


  let result: PaystackInitializeResponse;

  try {
    result =
      (await response.json()) as PaystackInitializeResponse;
  } catch {
    throw new Error("INVALID_PAYSTACK_RESPONSE");
  }

  if (
    !response.ok ||
    result.status !== true ||
    !result.data?.authorization_url ||
    !result.data.access_code ||
    result.data.reference !== input.reference
  ) {
    throw new Error("PAYSTACK_INITIALIZATION_FAILED");
  }

  return {
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
    reference: result.data.reference,
  };
}


type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};

export async function verifyPaystackTransaction(
  reference: string,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const baseUrl =
    process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY_NOT_CONFIGURED");
  }

    let response: Response;

    try {
        response = await fetch(
            `${baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
            {
                method: "GET",
                signal: AbortSignal.timeout(15000),
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                },
            },
        );
    } catch (error) {
        if (isPaystackTimeout(error)) {
            console.error("Paystack verification request timed out.");
            throw new Error("PAYSTACK_REQUEST_TIMEOUT");
        }

        if (error instanceof Error) {
            console.error(
                "Paystack verification network error:",
                error.name,
                error.message,
            );
        } else {
            console.error("Paystack verification failed with an unknown error.");
        }

        throw new Error("PAYSTACK_VERIFICATION_FAILED");
    }


  let result: PaystackVerifyResponse;

  try {
    result = (await response.json()) as PaystackVerifyResponse;
  } catch {
    throw new Error("INVALID_PAYSTACK_RESPONSE");
  }

  if (!response.ok || result.status !== true) {
  console.error("Paystack rejected verification:", {
    httpStatus: response.status,
    providerMessage: result.message ?? "No provider message",
  });

  throw new Error("PAYSTACK_VERIFICATION_FAILED");
}

if (
  !result.data ||
  result.data.reference !== reference ||
  typeof result.data.amount !== "number" ||
  typeof result.data.currency !== "string" ||
  typeof result.data.status !== "string"
) {
  console.error("Paystack verification response failed validation.");
  throw new Error("PAYSTACK_VERIFICATION_FAILED");
}

  return {
    reference: result.data.reference,
    amount: result.data.amount,
    currency: result.data.currency,
    status: result.data.status,
  };
}