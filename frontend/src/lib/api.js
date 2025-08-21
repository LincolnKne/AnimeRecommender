const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok)
        throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
}
async function postJSON(url, body) {
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!r.ok)
        throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
}
export const api = {
    search: (q, limit, nsfwOk) => getJSON(`${BASE_URL}/api/search?q=${encodeURIComponent(q)}&limit=${limit}&nsfw_ok=${nsfwOk ? "true" : "false"}`),
    tags: (nsfwOk) => getJSON(`${BASE_URL}/api/tags?nsfw_ok=${nsfwOk ? "true" : "false"}`),
    config: (nsfwOk) => getJSON(`${BASE_URL}/api/config?nsfw_ok=${nsfwOk ? "true" : "false"}`),
    animeById: (id) => getJSON(`${BASE_URL}/api/anime/${id}`),
    recommend: (payload) => postJSON(`${BASE_URL}/api/recommend`, payload),
    recommendMore: (payload) => postJSON(`${BASE_URL}/api/recommend/more`, payload),
};
