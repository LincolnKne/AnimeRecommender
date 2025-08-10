const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function get<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(BASE_URL + path);
  Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
