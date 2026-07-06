import type { WeekData, DayData, ImageRef } from '../types';

const BASE = '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
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
      { method: 'POST', body: form },
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
