import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: undefined,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
