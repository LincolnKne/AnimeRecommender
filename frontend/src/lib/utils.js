export const matchesQuery = (title, q) => !q.trim() || title.toLowerCase().includes(q.trim().toLowerCase());
export const truncate = (s, n) => !s ? "" : s.length > n ? s.slice(0, n) + "…" : s;
