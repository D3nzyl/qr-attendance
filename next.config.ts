import { createNextDevRewrites } from "@allocatespace/as2-platform-sdk";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  env: {
    AS2_DEV_GATEWAY_URL: process.env.AS2_DEV_GATEWAY_URL,
    AS2_DEV_LOGIN_EMAIL: process.env.AS2_DEV_LOGIN_EMAIL,
    AS2_DEV_LOGIN_PASSWORD: process.env.AS2_DEV_LOGIN_PASSWORD,
    AS2_DEV_WORKSPACE_ID: process.env.AS2_DEV_WORKSPACE_ID,
    AS2_DEV_SOLUTION_ID: process.env.AS2_DEV_SOLUTION_ID,
  },
  reactStrictMode: true,
  // Allow symlinking to the SDK package from the parent directory.
  turbopack: {
    root: path.resolve(import.meta.dirname, ".."),
  },
  // Allow compiling modules that live outside the project root.
  experimental: {
    externalDir: true,
  },
  rewrites: async () => {
    return createNextDevRewrites();
  },
};

export default nextConfig;
