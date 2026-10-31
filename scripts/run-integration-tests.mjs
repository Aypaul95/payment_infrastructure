
import { spawnSync } from "node:child_process";
import { emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";

const databaseName = "payment_infrastructure_test";

function readPassword(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || !stdout.isTTY) {
      reject(new Error("Password input requires an interactive terminal."));
      return;
    }

    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdout.write(prompt);

    let password = "";

    function cleanup() {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(false);
      stdout.write("\n");
    }

    function onKeypress(character, key = {}) {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Password entry cancelled."));
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(password);
        return;
      }

      if (key.name === "backspace") {
        password = password.slice(0, -1);
        return;
      }

      if (character && !key.ctrl && !key.meta) {
        password += character;
      }
    }

    stdin.on("keypress", onKeypress);
  });
}

try {
  const password = await readPassword(
    "PostgreSQL password for payment_app: ",
  );

  if (!password) {
    throw new Error("A PostgreSQL password is required.");
  }

  const databaseUrl = new URL(
    `postgresql://payment_app@127.0.0.1:5432/${databaseName}?schema=public`,
  );

  databaseUrl.password = password;

  if (databaseUrl.pathname !== `/${databaseName}`) {
    throw new Error("Safety check failed: unexpected database.");
  }

  console.log("\nRunning integration tests against the test database...\n");

  const result = spawnSync(
    "npx",
    [
      "tsx",
      "--test",
      "tests/payment.integration.test.mts",
      "tests/auth.integration.test.mts",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl.toString(),
      },
    },
  );

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error("\nIntegration test runner failed:", error.message);
  process.exitCode = 1;
}