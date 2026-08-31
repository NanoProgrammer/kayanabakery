import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "karyanabakery.ca" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  // Fix: bcryptjs uses process.nextTick which doesn't work in Edge Runtime
  serverExternalPackages: ["bcryptjs"],
  // Fix: ESLint "nextVitals is not iterable" — skip lint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;