
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type {
  CreateRiderVehicleInput,
  UpdateRiderVehicleInput,
} from "../validators/rider-vehicle.validator";

export async function createRiderVehicle(
  riderId: string,
  input: CreateRiderVehicleInput,
) {
  try {
    return await prisma.riderVehicle.create({
      data: {
        riderId,
        ...input,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("VEHICLE_REGISTRATION_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function listRiderVehicles(riderId: string) {
  return prisma.riderVehicle.findMany({
    where: { riderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRiderVehicle(
  riderId: string,
  vehicleId: string,
) {
  return prisma.riderVehicle.findFirst({
    where: {
      id: vehicleId,
      riderId,
    },
  });
}

export async function updateRiderVehicle(
  riderId: string,
  vehicleId: string,
  input: UpdateRiderVehicleInput,
) {
  const result = await prisma.riderVehicle.updateMany({
    where: {
      id: vehicleId,
      riderId,
      isActive: true,
    },
    data: input,
  });

  if (result.count === 0) {
    throw new Error("VEHICLE_NOT_FOUND");
  }

  return getRiderVehicle(riderId, vehicleId);
}

export async function deactivateRiderVehicle(
  riderId: string,
  vehicleId: string,
) {
  const result = await prisma.riderVehicle.updateMany({
    where: {
      id: vehicleId,
      riderId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  if (result.count === 0) {
    throw new Error("VEHICLE_NOT_FOUND");
  }

  return getRiderVehicle(riderId, vehicleId);
}
