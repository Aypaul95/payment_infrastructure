
import { prisma } from "../lib/prisma";
import type { CreateCustomerInput } from "../validators/customer.validator";

export async function createCustomer(
  businessAccountId: string,
  input: CreateCustomerInput,
) {
  return prisma.customer.create({
    data: {
      businessAccountId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      reference: input.reference,
    },
    select: {
      id: true,
      businessAccountId: true,
      name: true,
      email: true,
      phone: true,
      reference: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function listCustomers(businessAccountId: string) {
  return prisma.customer.findMany({
    where: {
      businessAccountId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      businessAccountId: true,
      name: true,
      email: true,
      phone: true,
      reference: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}


export async function getCustomerById(
  businessAccountId: string,
  customerId: string,
) {
  return prisma.customer.findFirst({
    where: {
      id: customerId,
      businessAccountId,
    },
    select: {
      id: true,
      businessAccountId: true,
      name: true,
      email: true,
      phone: true,
      reference: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}