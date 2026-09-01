import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@node-rs/bcrypt"],
  allowedDevOrigins: ["192.168.1.9", "192.168.1.9:3000", "http://192.168.1.9:3000"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [70, 75, 85, 95, 100],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Workaround for "Cannot write to a CLOSED writable stream" on mobile dev origins
      config.infrastructureLogging = { level: 'error' };
    }
    return config;
  },
}

export default nextConfig