import { BetterAuthPlugin } from "better-auth";

import { getSolutionSession } from "./routes";

export const solutionUserAuthPlugin = () => {
  return {
    id: "solutionUserAuth",
    endpoints: {
      getSolutionSession: getSolutionSession(),
    },
  } satisfies BetterAuthPlugin;
};
