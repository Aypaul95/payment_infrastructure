import multer from "multer";
import { MAX_KYC_FILE_SIZE } from "../services/rider-kyc-file.service";

export const riderKycUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_KYC_FILE_SIZE,
    files: 1,
    fields: 1,
    parts: 2,
  },
}).single("document");
