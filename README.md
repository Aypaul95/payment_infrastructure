# Payment Infrastructure API

A Node.js and PostgreSQL payment collection backend for businesses, featuring business registration, authentication, customer management, Paystack integration, payment verification, and automated payment reconciliation.

## Overview

Payment Infrastructure API is a backend project designed to provide businesses with a foundation for managing payment collection workflows programmatically.

It combines a REST API, PostgreSQL database, Prisma ORM, and Paystack integration to support business accounts, customer records, payment processing, transaction verification, webhook handling, and automated reconciliation.

The system is designed to handle important payment-processing concerns such as duplicate requests, delayed provider confirmations, failed verification attempts, and recovery of pending transactions.

## Features

### 1. Business Account Management
- Business account registration.
- Business user association.
- Business account-related data management.

### 2. Authentication
- Business user registration and login.
- Password hashing with bcryptjs.
- JWT-based authentication.
- Role-based business user structure.

### 3. Customer Management
- Customer record creation and management.
- Customer association with business accounts.
- Customer-related payment workflows.

### 4. Payment Processing
- Payment record creation.
- Payment initialization through Paystack.
- Generation of Paystack authorization URLs.
- Payment reference validation.
- Payment status management.

### 5. Payment Verification
- Independent transaction verification through Paystack.
- Validation of transaction reference, amount, and currency.
- Protection against trusting client-supplied payment status.
- Safe handling of repeated payment confirmation requests.

### 6. Payment Idempotency
- Idempotency keys for payment creation.
- Prevention of duplicate payment records when requests are repeated.
- Business-account-scoped idempotency.

### 7. Webhook Handling
- Paystack webhook signature verification using HMAC SHA512.
- Raw request-body handling for signature validation.
- Validation of incoming payment notifications.
- Handling of repeated webhook deliveries.
- Independent provider verification before confirming payment success.

### 8. Automated Payment Reconciliation
- Background processing of pending payments.
- Automatic retry scheduling.
- Provider-error handling.
- Reconciliation attempt history.
- Payment recovery through repeated verification.

### 9. Reconciliation Worker
- Separate background worker process.
- Atomic payment claiming using PostgreSQL `FOR UPDATE SKIP LOCKED`.
- Unique reconciliation lock tokens.
- Two-minute processing leases.
- Recovery of payments whose worker lease expires.
- Graceful worker shutdown using `AbortSignal`.

### 10. Input Validation and Database Management
- Request validation using Zod.
- PostgreSQL relational data storage.
- Prisma ORM.
- Database schema migrations.
- Environment-based configuration.

## Payment Reconciliation

The reconciliation service automatically checks eligible pending payments and attempts to establish their actual status with Paystack.

### Retry Schedule

| Attempt | Next retry delay |
|---|---|
| First | 5 minutes |
| Second | 15 minutes |
| Third | 30 minutes |
| Subsequent attempts | 60 minutes |

### Reconciliation Limits

| Configuration | Value |
|---|---|
| Maximum reconciliation attempts | 10 |
| Maximum payment age | 24 hours |
| Worker processing lease | 2 minutes |
| Worker idle polling delay | 5 seconds |
| Worker error delay | 5 seconds |

Only payments with `STILL_PENDING` or `PROVIDER_ERROR` outcomes are automatically scheduled for another attempt, provided they remain within the retry limits.

The reconciliation service records these outcomes:

- `SUCCESSFUL`
- `STILL_PENDING`
- `DETAILS_MISMATCH`
- `PROVIDER_ERROR`
- `NOT_FOUND`
- `NOT_PENDING`

Each reconciliation attempt is recorded in the payment reconciliation history.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| TypeScript | Type-safe application development |
| Express 5 | REST API framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| Zod | Request validation |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Paystack | Payment initialization and verification |
| Node.js Fetch API | External HTTP requests |

## Project Structure

```text
payment_infrastructure/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── scripts/
│   └── run-integration-tests.mjs
├── src/
│   ├── lib/
│   │   └── prisma.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── payment.routes.ts
│   │   └── paystack-webhook.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   ├── payment-confirmation.service.ts
│   │   ├── payment-idempotency.ts
│   │   ├── payment-reconciliation.service.ts
│   │   ├── payment.service.ts
│   │   └── paystack.service.ts
│   ├── validators/
│   ├── workers/
│   │   ├── payment-reconciliation.worker-entry.ts
│   │   └── payment-reconciliation.worker.ts
│   ├── app.ts
│   └── server.ts
├── tests/
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

Install the following:

- Node.js 18 or later
- npm
- PostgreSQL
- Git
- A Paystack test account

### 1. Clone the repository

```bash
git clone https://github.com/Aypaul95/payment_infrastructure.git

cd payment_infrastructure
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

```dotenv
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_long_random_secret"
PAYSTACK_SECRET_KEY="your_paystack_test_secret_key"
PAYSTACK_BASE_URL="https://api.paystack.co"
```

Replace the example values with your own configuration.

`PAYSTACK_BASE_URL` is optional because the application defaults to `https://api.paystack.co`.

**Security:** Never commit `.env` or expose database credentials, JWT secrets, Paystack secret keys, or authentication tokens.

### 4. Set up the database

Ensure PostgreSQL is running and the database specified in `DATABASE_URL` exists.

Generate the Prisma client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

### 5. Build the application

```bash
npm run build
```

### 6. Start the development server

```bash
npm run dev
```

The API runs locally at:

```text
http://127.0.0.1:3000
```
### 7. Swagger interactive API documentation is at

http://127.0.0.1:3000/docs/

### 8. Check the health endpoint

```bash
curl -i http://127.0.0.1:3000/health
```

The health endpoint should return HTTP 200 when the API server is running.

## Running the Reconciliation Worker

The reconciliation worker runs separately from the API server.

Start it with:

```bash
npm run worker:reconciliation
```

The worker continuously checks for eligible pending payments and processes them through the reconciliation service.

Run the API server and reconciliation worker as separate processes.

## Testing

The project includes unit tests and integration tests.

### Run unit tests

```bash
npm run test:unit
```

### Run integration tests

```bash
npm run test:integration
```

Integration tests use a dedicated test database named `payment_infrastructure_test`. Configure the database and provide its password when prompted by the test runner.

### Build verification

```bash
npm run build
```

## Available npm Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Compiles the TypeScript application |
| `npm start` | Starts the compiled API server |
| `npm run worker:reconciliation` | Starts the reconciliation worker |
| `npm run test:unit` | Runs unit tests |
| `npm run test:integration` | Runs integration tests |

## Security Considerations

The project incorporates several payment security practices:

- Password hashing using bcryptjs.
- JWT-based authentication.
- Environment-based secret configuration.
- Input validation using Zod.
- Paystack webhook signature verification.
- Independent provider-side transaction verification.
- Payment idempotency.
- Reconciliation attempt tracking.
- Atomic payment claiming and worker locking.

Before production deployment, additional security testing, HTTPS configuration, access-control review, monitoring, backup procedures, and production-grade secret management are required.

## Development Roadmap

Further development areas include:

- Expanding API documentation using OpenAPI/Swagger.
- Testing genuine webhook delivery using Paystack test events.
- Expanding authorization and business-account isolation tests.
- Adding more payment failure and concurrency scenarios.
- Improving structured logging and operational monitoring.
- Preparing production deployment and infrastructure.
- Conducting a comprehensive security review.

## Project Status

The project currently implements business registration, authentication, customer management, payment processing, Paystack transaction initialization and verification, webhook signature validation, payment idempotency, and automated payment reconciliation.

The TypeScript build has passed, and key unit and integration tests have been executed successfully in the local development environment.

**Integration status:** Local webhook simulations have been tested. Genuine webhook delivery from Paystack, production readiness, and end-to-end live deployment remain to be verified.

## Disclaimer

This project is under active development. It is not yet represented as a production-ready payment processing platform.

Complete integration testing, security review, infrastructure preparation, and operational checks are required before handling real payments.

## Author

**Aypaul95**

GitHub: https://github.com/Aypaul95

## Repository

https://github.com/Aypaul95/payment_infrastructure