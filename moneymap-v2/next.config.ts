import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack to this project folder so it doesn't walk up to the parent lockfile
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
