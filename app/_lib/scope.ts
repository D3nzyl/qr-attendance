import 'server-only';

/**
 * Platform scope (workspace / solution) extracted from request headers. The AS2
 * SDK seeds these from sessionStorage on the client and sends them as headers;
 * our own API routes read them here to scope Days and group S3 uploads.
 */

export const HEADER_WORKSPACE_ID = 'workspace-id';
export const HEADER_SOLUTION_ID = 'solution-id';

// Values are Mongo ObjectIds; keep them to a single safe key segment so a
// malformed/injected header can't traverse an S3 key or reach an unexpected doc.
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function safeSegment(value: string | null): string | undefined {
  return value && SAFE_ID.test(value) ? value : undefined;
}

export type Scope = { workspaceId?: string; solutionId?: string };

export function getScope(req: Request): Scope {
  return {
    workspaceId: safeSegment(req.headers.get(HEADER_WORKSPACE_ID)),
    solutionId: safeSegment(req.headers.get(HEADER_SOLUTION_ID)),
  };
}
