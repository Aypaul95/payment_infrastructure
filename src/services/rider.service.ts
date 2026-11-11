
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type {
  RegisterRiderInput,
  LoginRiderInput,
} from "../validators/rider.validator";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const JWT_EXPIRES_IN = "15m";
const BCRYPT_ROUNDS = 12;

function normalizeNigerianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("234") && digits.length === 13) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  throw new Error("INVALID_PHONE_NUMBER");
}

function createRiderAccessToken(rider: {
  id: string;
}): string {
  return jwt.sign(
    {
      accountType: "RIDER",
    },
    JWT_SECRET!,
    {
      subject: rider.id,
      expiresIn: JWT_EXPIRES_IN,
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

export async function registerRider(input: RegisterRiderInput) {
  const phone = normalizeNigerianPhone(input.phone);
  const passwordHash = await bcrypt.hash(
    input.password,
    BCRYPT_ROUNDS,
  );

  try {
    const rider = await prisma.rider.create({
      data: {
        fullName: input.fullName,
        phone,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        approvalStatus: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      rider,
      accessToken: createRiderAccessToken(rider),
      tokenType: "Bearer",
      expiresIn: 900,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("RIDER_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function loginRider(input: LoginRiderInput) {
  const phone = normalizeNigerianPhone(input.phone);

  const rider = await prisma.rider.findUnique({
    where: { phone },
  });

  if (!rider) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    rider.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!rider.isActive) {
    throw new Error("RIDER_ACCOUNT_DISABLED");
  }

  return {
    rider: {
      id: rider.id,
      fullName: rider.fullName,
      phone: rider.phone,
      email: rider.email,
      approvalStatus: rider.approvalStatus,
      isActive: rider.isActive,
    },
    accessToken: createRiderAccessToken(rider),
    tokenType: "Bearer",
    expiresIn: 900,
  };
}
