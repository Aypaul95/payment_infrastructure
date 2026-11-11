import { z } from "zod";

export const createRiderKycSubmissionSchema = z.object({
  documentType: z.enum([
    "NIN",
    "NATIONAL_ID",
    "DRIVERS_LICENSE",
    "INTERNATIONAL_PASSPORT",
    "VOTERS_CARD",
  ]),
});
