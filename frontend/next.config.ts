import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Silence the workspace root warning
  outputFileTracingRoot: undefined,
};

export default nextConfig;
