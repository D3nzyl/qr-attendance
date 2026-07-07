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
};

export default nextConfig;
