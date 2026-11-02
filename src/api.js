// Read-only client for the free a16z speedrun jobs API (https://speedrun-talent-network.com/developers).
const BASE = 'https://speedrun-talent-network.com/api/v1';
const SOURCE = 'sponsorship-check';

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries({ ...params, source: SOURCE })) if (v !== '' && v != null) url.searchParams.set(k, v);
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || `Jobs API returned ${res.status}`);
  return body;
}

/** One page of roles (50 per page, pages count from 0), without descriptions. */
export const searchJobs = params => get('/jobs', params);

/** One role with its full description text. */
export const getJob = async id => (await get(`/jobs/${encodeURIComponent(id)}`)).job;

/** Runs fn over items, at most `limit` at a time, keeping order. */
export async function mapLimited(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
