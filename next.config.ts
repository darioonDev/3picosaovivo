import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Hostinger's Node.js hosting — produces a minimal
  // self-contained server bundle it can run directly.
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
