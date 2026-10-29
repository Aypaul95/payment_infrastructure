
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const JWT_EXPIRES_IN = "15m";
const BCRYPT_ROUNDS = 12;

function createAccessToken(user: {
  id: string;
  businessAccountId: string;
  role: string;
}): string {
  return jwt.sign(
    {
      businessAccountId: user.businessAccountId,
      role: user.role,
    },
    JWT_SECRET!,
    {
      subject: user.id,
      expiresIn: JWT_EXPIRES_IN,
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

export async function registerBusiness(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const businessAccount = await tx.businessAccount.create({
        data: {
          businessName: input.businessName,
          email: input.email,
        },
      });

      return tx.businessUser.create({
        data: {
          businessAccountId: businessAccount.id,
          fullName: input.fullName,
          email: input.email,
          passwordHash,
          role: "OWNER",
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          businessAccount: {
            select: {
              id: true,
              businessName: true,
              currency: true,
            },
          },
        },
      });
    });

    return {
      user: {
        ...user,
        businessAccountId: user.businessAccount.id,
      },
      accessToken: createAccessToken({
        id: user.id,
        businessAccountId: user.businessAccount.id,
        role: user.role,
      }),
      tokenType: "Bearer",
      expiresIn: 900,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function loginBusiness(input: LoginInput) {
  const user = await prisma.businessUser.findUnique({
    where: { email: input.email },
    include: {
      businessAccount: {
        select: {
          id: true,
          businessName: true,
          currency: true,
          isActive: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.isActive || !user.businessAccount.isActive) {
    throw new Error("ACCOUNT_DISABLED");
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      businessAccountId: user.businessAccount.id,
      businessAccount: user.businessAccount,
    },
    accessToken: createAccessToken({
      id: user.id,
      businessAccountId: user.businessAccount.id,
      role: user.role,
    }),
    tokenType: "Bearer",
    expiresIn: 900,
  };
}
