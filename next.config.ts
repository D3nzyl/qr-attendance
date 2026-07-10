import { createNextDevRewrites } from "@allocatespace/as2-platform-sdk";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    AS2_DEV_GATEWAY_URL: process.env.AS2_DEV_GATEWAY_URL,
    AS2_DEV_LOGIN_EMAIL: process.env.AS2_DEV_LOGIN_EMAIL,
    AS2_DEV_LOGIN_PASSWORD: process.env.AS2_DEV_LOGIN_PASSWORD,
    AS2_DEV_WORKSPACE_ID: process.env.AS2_DEV_WORKSPACE_ID,
    AS2_DEV_SOLUTION_ID: process.env.AS2_DEV_SOLUTION_ID,
  },
  reactStrictMode: true,
  rewrites: async () => {
    return createNextDevRewrites();
  },
};

export default nextConfig;
