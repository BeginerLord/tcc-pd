import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone for now to see if it helps with Netlify
  // output: 'standalone',

  // Explicitly set the workspace root
  outputFileTracingRoot: process.cwd(),

  // Disable static optimization for error pages
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
