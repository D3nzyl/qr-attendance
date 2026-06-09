import { createAuthClient as createBetterAuthClient } from "better-auth/react";

import { solutionUserAuthClientPlugin } from "./plugins/solution-user-auth-plugin/solution-user-auth-plugin-client";

export interface AuthClientOptions {
  baseURL?: string;
}

export const createAppAuthClient = (props?: AuthClientOptions) =>
  createBetterAuthClient({
    baseURL: props?.baseURL,
    plugins: [solutionUserAuthClientPlugin()],
    fetchOptions: {
      baseURL: props?.baseURL,
      headers: {
        "access-control-allow-credentials": "true",
      },
      credentials: "include",
    },
  });

export type AppAuthClient = ReturnType<typeof createAppAuthClient>;
export type AppSession = AppAuthClient["$Infer"]["Session"];

export const authClient: AppAuthClient = createAppAuthClient({
  baseURL: "http://localhost:4000",
});

export type AuthSession =
  | ReturnType<typeof createAppAuthClient>["$Infer"]["Session"]
  | null;
