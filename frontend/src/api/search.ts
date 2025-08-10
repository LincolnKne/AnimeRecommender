import { get } from "./client";
export type SearchItem = {
  id: number; title: string; main_picture?: string; synopsis?: string; total_episodes?: number;
};
export const searchAnime = (q: string, limit = 10) => get<SearchItem[]>("/search", { q, limit });
