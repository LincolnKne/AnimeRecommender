export const matchesQuery = (title: string, q: string) =>
  !q.trim() || title.toLowerCase().includes(q.trim().toLowerCase());

export const truncate = (s: string, n: number) =>
  !s ? "" : s.length > n ? s.slice(0, n) + "…" : s;
