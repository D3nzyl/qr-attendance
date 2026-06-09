import { InferUserFromClient } from "better-auth";

export type SolutionUser = InferUserFromClient<{}> & {
  workspaceEndUserId?: string;
};
