import { uploadCloudinary } from "./cloudinary";
import { uploadLocal } from "./local";
import type { UploadResult } from "./types";

export type { UploadProvider, UploadResult } from "./types";

function getUploadDriver() {
  return (process.env.UPLOAD_DRIVER || "local").trim().toLowerCase();
}

export async function uploadImage(file: Blob): Promise<UploadResult> {
  const driver = getUploadDriver();

  if (driver === "local") {
    return uploadLocal(file);
  }

  if (driver === "cloudinary" || driver === "cloud") {
    return uploadCloudinary(file);
  }

  throw new Error(
    `UPLOAD_DRIVER="${driver}" không được hỗ trợ. Dùng "local" hoặc "cloudinary".`
  );
}
