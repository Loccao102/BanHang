import fs from "fs/promises";
import path from "path";
import type { UploadResult } from "./types";

function extensionFromMime(mime: string) {
  return mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
}

export async function uploadLocal(file: Blob): Promise<UploadResult> {
  const mime = file.type || "image/jpeg";
  const extension = extensionFromMime(mime);
  const filename = `prod-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return {
    url: `/api/uploads/${filename}`,
    key: filename,
    provider: "local"
  };
}
