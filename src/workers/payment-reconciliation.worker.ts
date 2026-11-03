
import { processNextPayment } from "../services/payment-reconciliation.service.js";

const IDLE_DELAY_MS = 5_000;
const ERROR_DELAY_MS = 5_000;

type PaymentProcessor = typeof processNextPayment;

interface WorkerOptions {
  processPayment?: PaymentProcessor;
  idleDelayMs?: number;
  errorDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  onError?: (error: unknown) => void;
  onPaymentProcessed?: (
    result: NonNullable<Awaited<ReturnType<PaymentProcessor>>>,
  ) => void;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function runReconciliationWorker(
  options: WorkerOptions = {},
  signal?: AbortSignal,
): Promise<void> {
  const processPayment = options.processPayment ?? processNextPayment;
  const idleDelay = options.idleDelayMs ?? IDLE_DELAY_MS;
  const errorDelay = options.errorDelayMs ?? ERROR_DELAY_MS;
  const wait = options.sleep ?? sleep;

  console.log("Payment reconciliation worker started.");

  while (!signal?.aborted) {
    try {
      const result = await processPayment();

      if (result) {
        options.onPaymentProcessed?.(result);
      } else if (!signal?.aborted) {
        await wait(idleDelay);
      }
    } catch (error) {
      options.onError?.(error);
      console.error("Reconciliation worker error:", error);

      if (!signal?.aborted) {
        await wait(errorDelay);
      }
    }
  }

  console.log("Payment reconciliation worker stopped.");
}