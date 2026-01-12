import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    forceSwcTransforms: true,
  },
  trailingSlash: true,
  output: undefined,
};

export default nextConfig;
