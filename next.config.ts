import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.fashn.ai" },
      { protocol: "https", hostname: "media.fashn.ai" },
      { protocol: "https", hostname: "img.vietqr.io" }
    ]
  }
};

export default nextConfig;
