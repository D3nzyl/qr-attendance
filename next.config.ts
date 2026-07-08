import { createNextDevRewrites } from "@allocatespace/as2-platform-sdk";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow symlinking to the SDK package from the parent directory.
  turbopack: {
    root: path.resolve(import.meta.dirname, ".."),
  },
  // Allow compiling modules that live outside the project root.
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    // This for local development only to test the AS2.0 SDK API.
    // Can change to platform.dev.allo8.com if not hosting locally.
    return createNextDevRewrites("http://localhost:3002");
  },
};

export default nextConfig;
