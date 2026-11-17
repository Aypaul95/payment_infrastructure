import { prisma } from "../lib/prisma.js";
import { runSmsOutboxWorker } from "./sms-outbox.worker.js";

async function startWorker(): Promise<void> {
  const controller = new AbortController();

  function handleShutdown(signal: string): void {
    console.log(`\n${signal} received. Stopping SMS outbox worker...`);
    controller.abort();
  }

  process.once("SIGINT", handleShutdown);
  process.once("SIGTERM", handleShutdown);

  try {
    await runSmsOutboxWorker({}, controller.signal);
  } finally {
    process.off("SIGINT", handleShutdown);
    process.off("SIGTERM", handleShutdown);

    console.log("Disconnecting from PostgreSQL...");
    await prisma.$disconnect();

    console.log("SMS outbox worker stopped.");
  }
}

startWorker().catch((error: unknown) => {
  console.error("Fatal SMS outbox worker error:", error);
  process.exitCode = 1;
});