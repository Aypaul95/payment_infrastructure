CREATE UNIQUE INDEX "CustomerAddress_one_default_per_customer_key"
ON "CustomerAddress" ("customerId")
WHERE "isDefault" = true;