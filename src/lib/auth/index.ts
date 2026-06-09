import { createAuthClient as createBetterAuthClient } from "better-auth/react";

import { solutionUserAuthClientPlugin } from "./plugins/solution-user-auth-plugin/solution-user-auth-plugin-client";

export interface AuthClientOptions {
  baseURL?: string;
}

export const createAppAuthClient = (props?: AuthClientOptions) =>
  createBetterAuthClient({
    baseURL: props?.baseURL,
    plugins: [solutionUserAuthClientPlugin()],
  });

export type AppAuthClient = ReturnType<typeof createAppAuthClient>;
export type AppSession = AppAuthClient["$Infer"]["Session"];

export const authClient: AppAuthClient = createAppAuthClient({
  // Same origin as base-web so auth hits /api/auth and cookies are sent without CORS.
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

export type AuthSession =
  | ReturnType<typeof createAppAuthClient>["$Infer"]["Session"]
  | null;
