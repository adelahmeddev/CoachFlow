import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Disable Turbopack for production builds to avoid large .next/cache files
  // that exceed Cloudflare Pages 25 MiB asset limit
  experimental: {
    turbo: false,
  },
  // NOTE: turbopackMemoryEviction: "full" was removed — it evicts all cached
  // module graphs after every snapshot and reloads them from .next/dev/cache,
  // where superseded chunk lookups can deadlock forever (profile page et al.
  // hung on the loading skeleton with zero CPU / zero DB activity).
};

export default nextConfig;
