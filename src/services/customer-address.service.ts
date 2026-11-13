
import { prisma } from "../lib/prisma";
import type { Prisma } from "../generated/prisma/client";
import type {
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput,
} from "../validators/customer.validator";


const customerAddressSelect = {
  id: true,
  customerId: true,
  label: true,
  recipientName: true,
  recipientPhone: true,
  streetAddress: true,
  city: true,
  state: true,
  landmark: true,
  latitude: true,
  longitude: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function lockCustomer(
  tx: Prisma.TransactionClient,
  businessAccountId: string,
  customerId: string,
): Promise<boolean> {
  const customers = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Customer"
    WHERE
      "id" = ${customerId}
      AND "businessAccountId" = ${businessAccountId}
    FOR UPDATE
  `;

  return customers.length === 1;
}

export async function createCustomerAddress(
  businessAccountId: string,
  customerId: string,
  input: CreateCustomerAddressInput,
) {
  return prisma.$transaction(async (tx) => {
      const customerExists = await lockCustomer(
          tx,
          businessAccountId,
          customerId,
      );

      if (!customerExists) {
          return null;
      }

    const existingAddressCount = await tx.customerAddress.count({
      where: {
         customerId,
      },
    });

    const shouldBeDefault =
      input.isDefault === true || existingAddressCount === 0;

    if (shouldBeDefault) {
      await tx.customerAddress.updateMany({
        where: {
           customerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return tx.customerAddress.create({
      data: {
         customerId,
        label: input.label,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        streetAddress: input.streetAddress,
        city: input.city,
        state: input.state,
        landmark: input.landmark,
        latitude: input.latitude,
        longitude: input.longitude,
        isDefault: shouldBeDefault,
      },
      select: customerAddressSelect,
    });
  });
}

export async function listCustomerAddresses(
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

  return prisma.customerAddress.findMany({
    where: {
      customerId: customer.id,
    },
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: customerAddressSelect,
  });
}

export async function getCustomerAddressById(
  businessAccountId: string,
  customerId: string,
  addressId: string,
) {
  const address = await prisma.customerAddress.findFirst({
    where: {
      id: addressId,
      customerId,
      customer: {
        businessAccountId,
      },
    },
    select: customerAddressSelect,
  });

  return address;
}

export async function updateCustomerAddress(
  businessAccountId: string,
  customerId: string,
  addressId: string,
  input: UpdateCustomerAddressInput,
) {
  return prisma.$transaction(async (tx) => {
      const customerExists = await lockCustomer(
          tx,
          businessAccountId,
          customerId,
      );

      if (!customerExists) {
          return null;
      }

      const address = await tx.customerAddress.findFirst({
          where: {
              id: addressId,
              customerId,
          },
          select: {
              id: true,
          },
      });

      if (!address) {
          return null;
      }

      if (input.isDefault === true) {
          await tx.customerAddress.updateMany({
              where: {
                  customerId,
                  isDefault: true,
              },
              data: {
                  isDefault: false,
              },
          });
      }

      return tx.customerAddress.update({
          where: {
              id: address.id,
          },
          data: input,
          select: customerAddressSelect,
      });
  });
}

export async function deleteCustomerAddress(
  businessAccountId: string,
  customerId: string,
  addressId: string,
) {
  return prisma.$transaction(async (tx) => {
      const customerExists = await lockCustomer(
          tx,
          businessAccountId,
          customerId,
      );

      if (!customerExists) {
          return null;
      }

      const address = await tx.customerAddress.findFirst({
          where: {
              id: addressId,
              customerId,
          },
          select: {
              id: true,
              isDefault: true,
          },
      });

      if (!address) {
          return null;
      }

    await tx.customerAddress.delete({
      where: {
        id: address.id,
      },
    });

    if (address.isDefault) {
      const nextAddress = await tx.customerAddress.findFirst({
        where: {
          customerId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
        },
      });

      if (nextAddress) {
        await tx.customerAddress.update({
          where: {
            id: nextAddress.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return true;
  });
}

export async function setDefaultCustomerAddress(
  businessAccountId: string,
  customerId: string,
  addressId: string,
) {
  return prisma.$transaction(async (tx) => {
      const customerExists = await lockCustomer(
          tx,
          businessAccountId,
          customerId,
      );

      if (!customerExists) {
          return null;
      }

      const address = await tx.customerAddress.findFirst({
          where: {
              id: addressId,
              customerId,
          },
          select: {
              id: true,
          },
      });

      if (!address) {
          return null;
      }

    await tx.customerAddress.updateMany({
      where: {
        customerId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    return tx.customerAddress.update({
      where: {
        id: address.id,
      },
      data: {
        isDefault: true,
      },
      select: customerAddressSelect,
    });
  });
}
