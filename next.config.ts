import type { NextConfig } from "next";

const repoName = "William-math";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}` : undefined,
  allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],
};

export default nextConfig;
