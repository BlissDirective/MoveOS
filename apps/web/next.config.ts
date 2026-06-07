import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared design-system package (ships as TS source).
  transpilePackages: ["@moveros/ui"],
};

export default nextConfig;
