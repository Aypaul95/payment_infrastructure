import { processNextSmsOutboxJob } from "../services/sms-outbox.service.js";

const IDLE_DELAY_MS = 5_000;
const ERROR_DELAY_MS = 5_000;

type SmsProcessor = typeof processNextSmsOutboxJob;

interface WorkerOptions {
  processSms?: SmsProcessor;
  idleDelayMs?: number;
  errorDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  onError?: (error: unknown) => void;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function runSmsOutboxWorker(
  options: WorkerOptions = {},
  signal?: AbortSignal,
): Promise<void> {
  const processSms = options.processSms ?? processNextSmsOutboxJob;
  const idleDelay = options.idleDelayMs ?? IDLE_DELAY_MS;
  const errorDelay = options.errorDelayMs ?? ERROR_DELAY_MS;
  const wait = options.sleep ?? sleep;

  console.log("SMS outbox worker started.");

  while (!signal?.aborted) {
    try {
      const processed = await processSms();

      if (!processed && !signal?.aborted) {
        await wait(idleDelay);
      }
    } catch (error) {
      options.onError?.(error);
      console.error("SMS outbox worker error:", error);

      if (!signal?.aborted) {
        await wait(errorDelay);
      }
    }
  }

  console.log("SMS outbox worker stopped.");
}