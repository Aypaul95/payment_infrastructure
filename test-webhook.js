
require("dotenv").config();

const crypto = require("crypto");
const http = require("http");

const secret = process.env.PAYSTACK_SECRET_KEY;
const reference = process.env.TEST_WEBHOOK_REFERENCE;
const amount = Number(process.env.TEST_WEBHOOK_AMOUNT_KOBO);
const currency = process.env.TEST_WEBHOOK_CURRENCY || "NGN";

if (!secret) {
  console.error("Paystack secret key is not configured.");
  process.exit(1);
}

if (!reference) {
  console.error("TEST_WEBHOOK_REFERENCE is not configured.");
  process.exit(1);
}

if (!Number.isSafeInteger(amount) || amount <= 0) {
  console.error(
    "TEST_WEBHOOK_AMOUNT_KOBO must be a positive integer."
  );
  process.exit(1);
}

const payload = JSON.stringify({
  event: "charge.success",
  data: {
    reference,
    amount,
    currency,
    status: "success",
  },
});

const signature = crypto
  .createHmac("sha512", secret)
  .update(payload)
  .digest("hex");

const options = {
  hostname: "127.0.0.1",
  port: 3000,
  path: "/webhooks/paystack",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-paystack-signature": signature,
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = http.request(options, (res) => {
  let response = "";

  res.on("data", (chunk) => {
    response += chunk;
  });

  res.on("end", () => {
    console.log("Webhook test completed.");
    console.log("Reference:", reference);
    console.log("Amount (kobo):", amount);
    console.log("HTTP Status:", res.statusCode);
    console.log("Response:", response);
  });
});

req.on("error", (error) => {
  console.error("Request failed:", error.message);
});

req.write(payload);
req.end();