import { BetterAuthClientPlugin } from "better-auth";

import { solutionUserAuthPlugin } from "./solution-user-auth-plugin";

type SolutionUserAuthPlugin = typeof solutionUserAuthPlugin;
export const solutionUserAuthClientPlugin = () => {
  return {
    id: "solutionUserAuthClient",
    $InferServerPlugin: {} as ReturnType<SolutionUserAuthPlugin>,
  } satisfies BetterAuthClientPlugin;
};
