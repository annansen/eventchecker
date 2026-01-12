import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    ssr: true,
  },
  trailingSlash: true,
};

export default nextConfig;
