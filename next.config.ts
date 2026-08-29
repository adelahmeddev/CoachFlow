import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pg/bcrypt outside turbopack bundle: native deps are huge and
  // cause "Compiling /api/messages/unread-count" to take 10+ seconds
  // on cold start. Marking them external makes dev compile ~3x faster.
  serverExternalPackages: ["pg", "@node-rs/bcrypt"],
  // Allow phones on the LAN to load dev assets from http://192.168.1.9:3000.
  // Without this, Next.js 16 blocks cross-origin JS in dev and pages never
  // hydrate (buttons stay disabled, forms dead).
  allowedDevOrigins: ["192.168.1.9"],
  // Image optimization — sharp now installed, serve AVIF/WebP for brand logos
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default nextConfig;
