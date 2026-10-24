import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Connection", value: "close" }],
      },
    ];
  },
};

export default nextConfig;
