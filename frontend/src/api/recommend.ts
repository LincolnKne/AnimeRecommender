import { post } from "./client";
export type RecommendReq = {
  query?: string;
  liked_ids: number[];
  disliked_ids: number[];
  moods: string[];
  nsfw_ok: boolean;
  exclude_ids: number[];
  limit: number;
  semantic_query?: string;
};
export type ScoredAnime = {
  anime: { id: number; title: string; main_picture?: string; tags?: string[]; synopsis?: string; rating?: number; total_episodes?: number; is_nsfw?: boolean; };
  score: number;
  reason: { overlap_tags: string[]; note: string };
};
export const recommend = (req: RecommendReq) => post<ScoredAnime[]>("/recommend", req);
