import type { NextConfig } from "next";

// Zona waktu server: WIB (GMT+7)
process.env.TZ = "Asia/Jakarta";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
