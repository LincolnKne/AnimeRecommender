const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export const api = {
  search: (q: string, limit: number, nsfwOk: boolean) =>
    getJSON<import("./types").SearchItem[]>(
      `${BASE_URL}/api/search?q=${encodeURIComponent(q)}&limit=${limit}&nsfw_ok=${nsfwOk ? "true" : "false"}`
    ),
  tags: (nsfwOk: boolean) =>
    getJSON<{ tags: string[] }>(`${BASE_URL}/api/tags?nsfw_ok=${nsfwOk ? "true" : "false"}`),
  config: (nsfwOk: boolean) =>
  getJSON<{ tags: string[]; total_entries: number; last_updated: string | null }>(
    `${BASE_URL}/api/config?nsfw_ok=${nsfwOk ? "true" : "false"}`
  ),
  animeById: (id: number) => getJSON<any>(`${BASE_URL}/api/anime/${id}`),
  recommend: (payload: {
    query?: string;
    liked_ids: number[];
    disliked_ids: number[];
    moods: string[];
    nsfw_ok: boolean;
    exclude_ids: number[];
    limit: number;
  }) => postJSON<import("./types").ScoredAnime[]>(`${BASE_URL}/api/recommend`, payload),
  recommendMore: (payload: {
    query?: string;
    liked_ids: number[];
    disliked_ids: number[];
    moods: string[];
    nsfw_ok: boolean;
    exclude_ids: number[];
    limit: number;
  }) => postJSON<import("./types").ScoredAnime[]>(`${BASE_URL}/api/recommend/more`, payload),
};
