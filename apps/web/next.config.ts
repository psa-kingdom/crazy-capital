import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cc/ui", "@cc/types", "@cc/shared", "@cc/validation"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
