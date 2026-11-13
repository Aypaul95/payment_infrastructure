import { prisma } from "../lib/prisma";
import type { UpdateBusinessPickupLocationInput } from "../validators/business-location.validator";

export async function getBusinessPickupLocation(
  businessAccountId: string,
) {
  return prisma.businessAccount.findUnique({
    where: {
      id: businessAccountId,
    },
    select: {
      id: true,
      businessName: true,
      pickupStreetAddress: true,
      pickupCity: true,
      pickupState: true,
      pickupLandmark: true,
      pickupLatitude: true,
      pickupLongitude: true,
    },
  });
}

export async function updateBusinessPickupLocation(
  businessAccountId: string,
  input: UpdateBusinessPickupLocationInput,
) {
  return prisma.businessAccount.updateMany({
    where: {
      id: businessAccountId,
    },
    data: {
      pickupStreetAddress: input.pickupStreetAddress,
      pickupCity: input.pickupCity,
      pickupState: input.pickupState,
      pickupLandmark: input.pickupLandmark ?? null,
      pickupLatitude: input.pickupLatitude,
      pickupLongitude: input.pickupLongitude,
    },
  });
}