
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Payment Infrastructure API",
    version: "1.0.0",
    description:
      "Payment collection infrastructure API built with Node.js, TypeScript, PostgreSQL, Prisma, and Paystack.",
  },
  servers: [
    {
      url: "http://127.0.0.1:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "API health check" },
    { name: "Authentication", description: "Business registration and authentication" },
    { name: "Business Accounts", description: "Authenticated business account details" },
    { name: "Customers", description: "Business-scoped customer management" },
    { name: "Payments", description: "Payment creation, listing, initialization, and verification" },
    { name: "Webhooks", description: "Paystack payment event notifications" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter the access token returned by registration or login.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
        required: ["success", "message"],
      },
      ValidationError: {
        type: "object",
        properties: {
          field: { type: "string" },
          message: { type: "string" },
        },
        required: ["field", "message"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          businessName: { type: "string", minLength: 2, maxLength: 150 },
          fullName: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email", maxLength: 254 },
          password: {
            type: "string",
            minLength: 12,
            maxLength: 72,
            description: "Password must contain at least 12 characters.",
          },
        },
        required: ["businessName", "fullName", "email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", maxLength: 254 },
          password: { type: "string", minLength: 1, maxLength: 72 },
        },
        required: ["email", "password"],
      },
      BusinessAccount: {
        type: "object",
        properties: {
          id: { type: "string" },
          businessName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          currency: { type: "string", example: "NGN" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["OWNER", "ADMIN", "STAFF"] },
          businessAccountId: { type: "string" },
          businessAccount: {
            type: "object",
            properties: {
              id: { type: "string" },
              businessName: { type: "string" },
              currency: { type: "string" },
              isActive: { type: "boolean" },
            },
          },
        },
      },
      AuthResponseData: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          accessToken: { type: "string" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "integer", example: 900 },
        },
      },
      CustomerRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 150 },
          email: { type: "string", format: "email", maxLength: 254 },
          phone: { type: "string", minLength: 7, maxLength: 20 },
          reference: { type: "string", minLength: 1, maxLength: 100 },
        },
        required: ["name"],
      },
      Customer: {
        type: "object",
        properties: {
          id: { type: "string" },
          businessAccountId: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email", nullable: true },
          phone: { type: "string", nullable: true },
          reference: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PaymentRequest: {
        type: "object",
        properties: {
          idempotencyKey: {
            type: "string",
            minLength: 8,
            maxLength: 100,
            description: "Unique request key scoped to the business account.",
          },
          customerId: { type: "string" },
          amount: {
            type: "string",
            pattern: "^[1-9]\\d*$",
            description: "Positive whole amount in kobo, represented as a string.",
            example: "250000",
          },
          currency: {
            type: "string",
            enum: ["NGN"],
            default: "NGN",
          },
          description: { type: "string", maxLength: 500 },
        },
        required: ["idempotencyKey", "amount"],
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string" },
          businessAccountId: { type: "string" },
          customerId: { type: "string", nullable: true },
          idempotencyKey: { type: "string" },
          reference: { type: "string" },
          amount: {
            type: "string",
            description: "Amount in kobo, represented as a string.",
          },
          currency: { type: "string", example: "NGN" },
          status: {
            type: "string",
            enum: ["PENDING", "SUCCESSFUL", "FAILED"],
          },
          description: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      InitializePaymentRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
        required: ["email"],
      },
      PaystackInitializeData: {
        type: "object",
        description: "Paystack checkout initialization result.",
        properties: {
          authorizationUrl: { type: "string", format: "uri" },
          accessCode: { type: "string" },
          reference: { type: "string" },
        },
      },
      PaymentVerificationData: {
        type: "object",
        properties: {
          paymentId: { type: "string" },
          reference: { type: "string" },
          status: { type: "string" },
          providerStatus: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        security: [],
        responses: {
          "200": {
            description: "API is healthy.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: {
                      type: "string",
                      example: "payment-infrastructure-api",
                    },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a business and its owner",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Business registered successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/AuthResponseData" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request data.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Email already exists.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in a business user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/AuthResponseData" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request data.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Business or user account is disabled.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated user returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/AuthUser" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Account unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/business-accounts": {
      get: {
        tags: ["Business Accounts"],
        summary: "Get the authenticated business account",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Business account returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/BusinessAccount" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Business account unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Business Accounts"],
        summary: "Deprecated business registration endpoint",
        description: "This endpoint is disabled. Use POST /auth/register instead.",
        security: [],
        responses: {
          "410": {
            description: "Endpoint is no longer available.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/customers": {
      get: {
        tags: ["Customers"],
        summary: "List customers for the authenticated business",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customers returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Customer" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Customers"],
        summary: "Create a customer",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CustomerRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Customer created successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Customer" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid customer data.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Customer reference already exists.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/customers/{id}": {
      get: {
        tags: ["Customers"],
        summary: "Get a customer by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Customer returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Customer" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Customer not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/payments": {
      get: {
        tags: ["Payments"],
        summary: "List payments for the authenticated business",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Payments returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Payment" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Payments"],
        summary: "Create a payment record",
        description: "Creates a pending payment. Amount is expressed in kobo.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Payment record created successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid payment request.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Customer not found for this business.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Idempotency key reused with different payment details.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Get a payment by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Payment returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Payment not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/payments/{id}/initialize": {
      post: {
        tags: ["Payments"],
        summary: "Initialize Paystack checkout",
        description: "Creates a Paystack checkout session for a pending payment.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InitializePaymentRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Paystack checkout initialized successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/PaystackInitializeData" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid email or request.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Payment not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Payment is not pending.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Paystack is not configured.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "502": {
            description: "Paystack checkout initialization failed.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/payments/{id}/verify": {
      post: {
        tags: ["Payments"],
        summary: "Verify a payment with Paystack",
        description: "Checks the provider transaction status and confirms payment.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Payment verification result.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/PaymentVerificationData" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Payment not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Payment cannot be verified due to status or mismatch.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Paystack is not configured.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "502": {
            description: "Paystack verification failed.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/payments/{id}/status": {
      patch: {
        tags: ["Payments"],
        summary: "Direct payment status update (disabled)",
        description: "This endpoint is disabled. Payment status is confirmed by provider verification or webhook.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "403": {
            description: "Direct status update is forbidden.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/webhooks/paystack": {
      post: {
        tags: ["Webhooks"],
        summary: "Receive Paystack webhook events",
        description:
          "Public provider endpoint. Paystack signs the raw JSON body with HMAC SHA512 and sends the signature in x-paystack-signature. The signature is validated before processing. Non-charge.success events and events requiring review are acknowledged with HTTP 200.",
        security: [],
        parameters: [
          {
            name: "x-paystack-signature",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Paystack HMAC SHA512 signature of the raw request body.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  event: { type: "string", example: "charge.success" },
                  data: {
                    type: "object",
                    properties: {
                      reference: { type: "string" },
                      amount: { type: "integer", description: "Amount in kobo." },
                      currency: { type: "string", example: "NGN" },
                      status: { type: "string", example: "success" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook accepted or acknowledged for review.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Malformed JSON or invalid event data.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid Paystack signature.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Webhook secret missing or processing failed.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const;