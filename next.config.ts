import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network dev access so /_next/* assets don't warn/block on 192.168.4.25.
  allowedDevOrigins: ["192.168.4.25"],
};

export default nextConfig;
