
import { prisma } from "../lib/prisma.js";
import { runReconciliationWorker } from "./payment-reconciliation.worker.js";

async function startWorker(): Promise<void> {
  const controller = new AbortController();

  function handleShutdown(signal: string): void {
    console.log(`\n${signal} received. Stopping reconciliation worker...`);
    controller.abort();
  }

  process.once("SIGINT", handleShutdown);
  process.once("SIGTERM", handleShutdown);

  try {
    await runReconciliationWorker({}, controller.signal);
  } finally {
    process.off("SIGINT", handleShutdown);
    process.off("SIGTERM", handleShutdown);

    console.log("Disconnecting from PostgreSQL...");
    await prisma.$disconnect();

    console.log("Payment reconciliation worker stopped.");
  }
}

startWorker().catch((error: unknown) => {
  console.error("Fatal reconciliation worker error:", error);
  process.exitCode = 1;
});