import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@node-rs/bcrypt"],
  allowedDevOrigins: ["192.168.1.9"],
  // Image optimization — sharp now installed, serve AVIF/WebP for brand logos
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [70, 75, 95],
  },
};

export default nextConfig;
