import type { WeekData, DayData, ImageRef } from '../types';
import { as2Client } from './as2-client';

const BASE = '/api';

// Platform scope headers, mirroring what the AS2 SDK attaches to its own
// requests. Sent on uploads so the server can group objects by workspace/solution.
function scopeHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const workspaceId = as2Client.getWorkspaceId();
  const solutionId = as2Client.getSolutionId();
  if (workspaceId) headers['workspace-id'] = workspaceId;
  if (solutionId) headers['solution-id'] = solutionId;
  return headers;
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...scopeHeaders(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getWeek: (contract: string, teamNo: string, weekKey: string): Promise<WeekData> =>
    req('GET', `/week/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}`),

  saveDay: (
    contract: string,
    teamNo: string,
    weekKey: string,
    day: string,
    company: string,
    dayData: Partial<DayData>,
  ): Promise<{ ok: boolean }> =>
    req('PUT', `/day/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}/${enc(day)}`, { company, ...dayData }),

  clearDay: (contract: string, teamNo: string, weekKey: string, day: string): Promise<{ ok: boolean }> =>
    req('DELETE', `/day/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}/${enc(day)}`),

  uploadImage: async (
    contract: string,
    teamNo: string,
    weekKey: string,
    day: string,
    file: Blob,
  ): Promise<ImageRef> => {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(
      `/api/images/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}/${enc(day)}`,
      { method: 'POST', body: form, headers: scopeHeaders() },
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json() as Promise<ImageRef>; // { id, name, url }
  },

  deleteImage: (imageId: string): Promise<{ ok: boolean }> =>
    req('DELETE', `/images/${enc(imageId)}`),
};

function enc(s: string): string {
  return encodeURIComponent(s);
}
