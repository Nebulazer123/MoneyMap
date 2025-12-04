/** @type {import("next").NextConfig} */
const nextConfig = {
  // Allow local network dev access for this IP while keeping defaults for localhost.
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.4.25:3000",
    "http://192.168.4.25:3001",
  ],
};

export default nextConfig;
