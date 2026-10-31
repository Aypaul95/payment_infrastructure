
export interface IdempotencyRequest {
  customerId?: string | null;
  amount: bigint;
  currency: string;
  description?: string | null;
}

export interface ExistingPaymentForIdempotency {
  customerId: string | null;
  amount: bigint;
  currency: string;
  description: string | null;
}

export function isSamePaymentRequest(
  existingPayment: ExistingPaymentForIdempotency,
  input: IdempotencyRequest,
): boolean {
  return (
    existingPayment.customerId === (input.customerId ?? null) &&
    existingPayment.amount === input.amount &&
    existingPayment.currency === input.currency &&
    existingPayment.description === (input.description ?? null)
  );
}
