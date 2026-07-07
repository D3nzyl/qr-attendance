"use client";

import { AS2PlatformClient } from "@allocatespace/as2-platform-sdk";

function getAS2Client(): AS2PlatformClient {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_AS2_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_AS2_BASE_URL is not set — required for non-browser SDK construction.",
    );
  }

  return new AS2PlatformClient({ baseUrl });
}

export const as2Client = getAS2Client();
