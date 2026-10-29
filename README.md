# Payment Infrastructure API

A Node.js and PostgreSQL backend for business registration, authentication, customer management, and payment collection using Paystack.

## Overview

Payment Infrastructure API is a backend project designed to provide a foundation for businesses to manage payment collection workflows programmatically.

The project combines a REST API, PostgreSQL database, Prisma ORM, and Paystack integration to support business accounts and payment processing.

## Features

- **Business accounts:** Register and manage business account records.
- **Authentication:** Authenticate business users and associate them with their business accounts.
- **Customer management:** Support customer-related payment workflows.
- **Payment processing:** Create payment records and initialize payments through Paystack.
- **Payment verification:** Verify payment transactions and update their status.
- **Webhook handling:** Validate webhook signatures and handle repeated payment notifications.
- **Input validation:** Validate incoming request data.
- **Database migrations:** Manage database schema changes using Prisma.
- **Environment-based configuration:** Keep database credentials and API secrets outside source code.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| TypeScript | Type-safe application development |
| Express | REST API framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| Zod | Request validation |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Paystack | Payment initialization and verification |

## Project Status

The project currently includes business registration, authentication, customer-related functionality, payment workflows, Paystack integration code, and webhook signature validation.

The TypeScript build has passed, and key API and webhook behaviours have been tested locally.

**Integration status:** Local webhook simulations have been tested. Genuine webhook delivery from Paystack, production readiness, and end-to-end live deployment remain to be verified.

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git
- A Paystack test account for payment integration testing

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

Create a local `.env` file in the project root. Use the variable names expected by the application:

```dotenv
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_long_random_secret"
PAYSTACK_SECRET_KEY="your_paystack_test_secret_key"
PAYSTACK_BASE_URL="https://api.paystack.co"
```

Replace the example values with your own local configuration. Never commit `.env` or share its contents.

### 4. Set up the database

Ensure PostgreSQL is running and the database specified in `DATABASE_URL` exists.

Apply the project's Prisma migrations:

```bash
npx prisma migrate deploy
```

If you are developing new schema changes locally, use the migration workflow appropriate to your development environment.

### 5. Build the project

```bash
npm run build
```

### 6. Start the development server

```bash
npm run dev
```

The local API has been configured to run on:

`http://127.0.0.1:3000`

### 7. Check the health endpoint

```bash
curl -i http://127.0.0.1:3000/health
```

The health endpoint should return HTTP 200 when the server is running.

## Configuration and Security

- Keep `.env` out of version control.
- Use test credentials during development.
- Never expose Paystack secret keys, JWT secrets, database passwords, or authentication tokens in source code or logs.
- Validate incoming requests and enforce authentication and authorization on protected operations.
- Verify payment status with the payment provider rather than trusting a client-supplied status.
- Verify webhook signatures before processing webhook events.
- Make payment processing idempotent so repeated requests or webhook events do not duplicate successful transactions.
- Use HTTPS, appropriate logging, monitoring, and production-grade secret management before deployment.

## Development Workflow

Build and validate changes locally before committing them.

```bash
npm run build
git status
```

After reviewing your changes:

```bash
git add README.md
git commit -m "Add project README"
git push
```

## Roadmap

Planned areas for continued development include:

- Strengthening payment state transitions and idempotency.
- Testing webhook handling against genuine Paystack test events.
- Improving authorization and business-account data isolation.
- Expanding automated tests for authentication and payment workflows.
- Improving error handling, audit logging, and transaction reconciliation.
- Preparing deployment and production security checks.

## Disclaimer

This project is under active development. It is not yet represented as a production-ready payment processing platform. Complete integration testing, security review, and operational checks are required before handling real payments.

## Author

**Aypaul95**

GitHub: https://github.com/Aypaul95
