export type SearchItem = {
  id: number;
  title: string;
  all_titles?: string[];
  tags?: string[];
  main_picture?: { medium: string; large: string };
  synopsis?: string;
  total_episodes?: number;
  is_nsfw?: boolean;
};

export type ScoredAnime = {
  anime: {
    id: number;
    title: string;
    all_titles?: string[];
    tags?: string[];
    main_picture?: { medium: string; large: string };
    synopsis?: string;
    total_episodes?: number;
    is_nsfw?: boolean;
  };
  score: number;
  reason: { overlap_tags: string[]; note: string };
};

export type InputMode = "search" | "query";
export type PanelMode = "search" | "filters" | "lists" | "recs";
