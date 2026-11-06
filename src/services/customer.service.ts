
import { prisma } from "../lib/prisma";
import type { CreateCustomerInput, UpdateCustomerInput,} from "../validators/customer.validator";

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


export async function updateCustomer(
  businessAccountId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessAccountId,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    return null;
  }

  return prisma.customer.update({
    where: {
      id: customer.id,
    },
    data: input,
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

export async function deleteCustomer(
    businessAccountId: string,
    customerId: string,
) {
    const customer = await prisma.customer.findFirst({
        where: {
            id: customerId,
            businessAccountId,
        },
        select: {
            id: true,
        },
    });

    if (!customer) {
        return null;
    }

    const paymentCount = await prisma.payment.count({
        where: {
            customerId: customer.id,
            businessAccountId,
        },
    });

    if (paymentCount > 0) {
        return "HAS_PAYMENTS" as const;
    }

    await prisma.customer.delete({
        where: {
            id: customer.id,
        },
    });

    return true;
}

export async function getCustomerPayments(
  businessAccountId: string,
  customerId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessAccountId,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    return null;
  }

  const payments = await prisma.payment.findMany({
    where: {
      customerId,
      businessAccountId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toString(),
  }));
}