import type { UploadResult } from "./types";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: {
    message?: string;
  };
};

function parseCloudinaryUrl(value: string) {
  const parsed = new URL(value);

  if (parsed.protocol !== "cloudinary:") {
    throw new Error("CLOUDINARY_URL phải bắt đầu bằng cloudinary://");
  }

  return {
    cloudName: parsed.hostname,
    apiKey: decodeURIComponent(parsed.username),
    apiSecret: decodeURIComponent(parsed.password)
  };
}

function getCloudinaryConfig(): CloudinaryConfig {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "";
  let apiKey = process.env.CLOUDINARY_API_KEY?.trim() || "";
  let apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || "";

  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL.trim());
    cloudName ||= parsed.cloudName;
    apiKey ||= parsed.apiKey;
    apiSecret ||= parsed.apiSecret;
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Thiếu cấu hình Cloudinary. Hãy đặt CLOUDINARY_URL hoặc CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET."
    );
  }

  const folder = (process.env.CLOUDINARY_FOLDER || "lsoul/products")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  return { cloudName, apiKey, apiSecret, folder };
}

function extensionFromMime(mime: string) {
  return mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
}

export async function uploadCloudinary(file: Blob): Promise<UploadResult> {
  const { cloudName, apiKey, apiSecret, folder } = getCloudinaryConfig();
  const publicId = `prod-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const extension = extensionFromMime(file.type || "image/jpeg");
  const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

  const formData = new FormData();
  formData.append("file", file, `${publicId}.${extension}`);
  formData.append("public_id", fullPublicId);

  const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`
      },
      body: formData
    }
  );

  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(
      payload.error?.message || `Cloudinary upload thất bại (HTTP ${response.status}).`
    );
  }

  return {
    url: payload.secure_url,
    key: payload.public_id,
    provider: "cloudinary"
  };
}
