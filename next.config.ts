import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.9", "192.168.1.9:3000", "http://192.168.1.9:3000"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [70, 75, 85, 95, 100],
  },
  experimental: {
    serverActions: {
      // Raised from 2mb: progress photos/videos + payment receipts upload
      // through server actions (validated + capped per-file in actions).
      bodySizeLimit: "24mb",
    },
  },
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      // Workaround for "Cannot write to a CLOSED writable stream" on mobile dev origins
      config.infrastructureLogging = { level: 'error' };
    }
    return config;
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self' data: https:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
      frame-ancestors 'none';
      connect-src 'self' https: wss: ws:;
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
}

export default nextConfig