import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship as TS source — Next must transpile them.
  transpilePackages: [
    "@moveros/ui",
    "@moveros/db",
    "@moveros/agents",
    "@moveros/trpc",
    "@moveros/utils",
  ],
};

export default nextConfig;
