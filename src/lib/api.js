const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  getWeek: (contract, teamNo, weekKey) =>
    req('GET', `/week/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}`),

  saveDay: (contract, teamNo, weekKey, day, company, dayData) =>
    req('PUT', `/day/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}/${enc(day)}`, { company, ...dayData }),

  clearDay: (contract, teamNo, weekKey, day) =>
    req('DELETE', `/day/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}/${enc(day)}`),

  uploadImage: async (contract, teamNo, weekKey, day, file) => {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(
      `/api/images/${enc(contract)}/${enc(teamNo)}/${enc(weekKey)}/${enc(day)}`,
      { method: 'POST', body: form }
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json(); // { id, name, url }
  },

  deleteImage: (imageId) =>
    req('DELETE', `/images/${enc(imageId)}`),
};

function enc(s) {
  return encodeURIComponent(s);
}
