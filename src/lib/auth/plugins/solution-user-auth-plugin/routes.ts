import { createAuthEndpoint } from "better-auth/api";

type ReturnSessionType = {
  user: {
    phoneNumber: string | null | undefined;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
    role?: string | null | undefined;
    preferredLoginMethod?: string | null | undefined;
  };
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    metadata?: Record<string, any> | null | undefined;
  };
};

//This copied from the getSession endpoint in better-auth but modified to return the session from portal_user_session table instead of the session table
export const getSolutionSession = () =>
  createAuthEndpoint(
    "/solution/get-session",
    {
      method: ["GET", "POST"],
      operationId: "getSolutionSession",
      requireHeaders: true,
    },
    async (ctx): Promise<ReturnSessionType | null> => {
      return null;
    },
  );
