export type UploadProvider = "local" | "cloudinary";

export type UploadResult = {
  url: string;
  key: string;
  provider: UploadProvider;
};
