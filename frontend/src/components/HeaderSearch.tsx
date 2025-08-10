import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, ChevronDown, ThumbsUp, ThumbsDown, X } from "lucide-react";

/** Backend base URL via env */
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* ---- Types ---- */
type SearchItem = {
  id: number;
  title: string;
  main_picture?: { medium: string; large: string };
  synopsis?: string;
  total_episodes?: number;
};

type ScoredAnime = {
  anime: {
    id: number;
    title: string;
    main_picture?: { medium: string; large: string };
    synopsis?: string;
    total_episodes?: number;
  };
  score: number;
  reason: { overlap_tags: string[]; note: string };
};

/* ---- Small fetch helpers ---- */
const fetchJSON = async <T,>(url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return (await r.json()) as T;
};
const postJSON = async <T,>(url: string, body: any) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return (await r.json()) as T;
};

type InputMode = "search" | "query";
type PanelMode = "search" | "filters" | "lists" | "recs";

export default function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("search");
  const [panel, setPanel] = useState<PanelMode>("search");

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // search results + index
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [itemsById, setItemsById] = useState<Record<number, SearchItem>>({});

  // liked/disliked
  const [liked, setLiked] = useState<number[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]);
  const hasLists = liked.length > 0 || disliked.length > 0;

  // filters
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [nsfwOk, setNsfwOk] = useState(false);

  const [recs, setRecs] = useState<ScoredAnime[]>([]);
  const typingTimer = useRef<number | null>(null);

  /* ---------- helpers ---------- */
  const setResultsAndIndex = (items: SearchItem[]) => {
    setSearchResults(items);
    setItemsById(prev => {
      const next = { ...prev };
      for (const it of items) next[it.id] = it;
      return next;
    });
  };
  const matchesQuery = (item: SearchItem, q: string) => {
    const t = q.trim().toLowerCase();
    return !t || item.title.toLowerCase().includes(t);
  };
  const truncateText = (text: string, maxLength: number) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };


  // Inside your component:
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"; // Lock page scroll
    } else {
      document.body.style.overflow = ""; // Restore scroll
    }
  }, [open]);

  /* ---------- debounced search ---------- */
  useEffect(() => {
    if (inputMode !== "search") return;
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(async () => {
      if (!text.trim()) {
        setResultsAndIndex([]);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchJSON<SearchItem[]>(
          `${BASE_URL}/api/search?q=${encodeURIComponent(text)}&limit=20`
        );
        // hide items already liked/disliked
        setResultsAndIndex(data.filter(a => !liked.includes(a.id) && !disliked.includes(a.id)));
        setPanel("search");
        setOpen(true);
      } catch {
        setResultsAndIndex([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [text, inputMode, liked, disliked]);

  /* ---------- fetch tags (on mount / nsfw toggle) ---------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJSON<{ tags: string[] }>(
          `${BASE_URL}/api/tags?nsfw_ok=${nsfwOk ? "true" : "false"}`
        );
        setTags(data.tags);
      } catch {
        setTags([]);
      }
    })();
  }, [nsfwOk]);

  /* ---------- like/dislike behavior ---------- */
  const like = (id: number) => {
    setLiked(prev => [...new Set([...prev, id])]);
    setDisliked(prev => prev.filter(x => x !== id));
    setSearchResults(prev => prev.filter(x => x.id !== id)); // remove from results
  };
  const dislike = (id: number) => {
    setDisliked(prev => [...new Set([...prev, id])]);
    setLiked(prev => prev.filter(x => x !== id));
    setSearchResults(prev => prev.filter(x => x.id !== id));
  };
  const removeFromLiked = (id: number) => {
    setLiked(prev => prev.filter(x => x !== id));
    const item = itemsById[id];
    if (item && inputMode === "search" && matchesQuery(item, text)) {
      setSearchResults(prev => [item, ...prev.filter(x => x.id !== id)]);
    }
  };
  const removeFromDisliked = (id: number) => {
    setDisliked(prev => prev.filter(x => x !== id));
    const item = itemsById[id];
    if (item && inputMode === "search" && matchesQuery(item, text)) {
      setSearchResults(prev => [item, ...prev.filter(x => x.id !== id)]);
    }
  };

  /* ---------- panel mode rules ---------- */
  useEffect(() => {
    if (hasLists && panel !== "filters") {
      setPanel("lists");
      setOpen(true);
    } else if (!hasLists && panel === "lists") {
      setPanel(text.trim() ? "search" : "filters");
    }
  }, [hasLists]); // eslint-disable-line

  const toggleQS = () => {
    const next: InputMode = inputMode === "search" ? "query" : "search";
    setInputMode(next);
    if (next === "query") {
      setPanel(hasLists ? "lists" : "filters");
      setOpen(hasLists);
    } else {
      if (text.trim()) {
        setPanel("search");
        setOpen(true);
      }
    }
  };

  const openFilters = () => {
    setPanel("filters");
    setOpen(true);
  };

  const sendForRecs = async () => {
    setLoading(true);
    try {
      const payload = {
        query: inputMode === "query" ? text : undefined,
        liked_ids: liked,
        disliked_ids: disliked,
        moods: selectedTags,
        nsfw_ok: nsfwOk,
        exclude_ids: [],
        limit: 20,
      };
      const data = await postJSON<ScoredAnime[]>(`${BASE_URL}/api/recommend`, payload);
      setRecs(data);
      setPanel("recs");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const TagChip = ({ t }: { t: string }) => {
    const on = selectedTags.includes(t);
    return (
      <button
        onClick={() =>
          setSelectedTags(prev => (on ? prev.filter(x => x !== t) : [...prev, t]))
        }
        className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${
          on ? "bg-[#924DBF] text-white" : "bg-black/5 text-[#4A2574]"
        } hover:opacity-90`}
      >
        {t}
      </button>
    );
  };

  return (
    <section
      className="
        relative min-h-screen flex flex-col items-center justify-start
        bg-[url('/background.jpg')] bg-cover bg-center text-white
      "
    >
      {/* Gradient overlay: solid bottom then fade up */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#4A2574]/100 via-[#4A2574]/100 via-[55%] to-transparent pointer-events-none"></div>

      <div className="relative z-10 w-[56vw] max-w-4xl mt-[8vh] md:mt-[12vh] lg:mt-[16vh]">
        <h1 className="text-center font-extrabold mb-8 text-[clamp(2.75rem,5vw,4.25rem)] text-white">
          Anime Recommender
        </h1>

        <div className="relative w-full">
          {/* SEARCH BAR */}
          <div className="relative z-20 flex items-stretch h-16 rounded-full overflow-hidden
                          bg-[#7338A0] text-white shadow-xl
                          ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[#7338A0]/60">
            {/* Q/S chip */}
            <button
              type="button"
              onClick={toggleQS}
              className="px-5 text-sm font-semibold bg-[#7338A0] hover:bg-[#924DBF] transition rounded-l-full rounded-r-none flex items-center"
              title={inputMode === "search" ? "Switch to Query" : "Switch to Search"}
            >
              {inputMode === "search" ? "Search" : "Query"}
            </button>

            {/* Input */}
            <div className="relative flex-1 flex items-center">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => {
                  if (inputMode === "search") {
                    setPanel("search");
                    setOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (hasLists || inputMode === "query") sendForRecs();
                    else if (inputMode === "search" && text.trim()) setOpen(true);
                  }
                }}
                type="text"
                placeholder={
                  inputMode === "search"
                    ? "Search anime…"
                    : "Describe what you want (moods, vibes, titles, etc.)…"
                }
                className="w-full h-full bg-transparent text-white placeholder-white/70 pl-12 pr-14 border-none outline-none ring-0"
              />
            </div>

            {/* Filters button */}
            <button
              type="button"
              onClick={openFilters}
              className="px-4 rounded-r-full rounded-l-none bg-[#7338A0] hover:bg-[#924DBF] transition flex items-center justify-center"
              title="Filters"
            >
              <ChevronDown className={`h-5 w-5 ${panel === "filters" && open ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* DROPDOWN PANEL */}
          {open && (
            <div className="relative z-10 w-full -mt-[34px] pt-[34px] bg-white text-black shadow-xl rounded-t-none rounded-b-2xl max-h-[60vh] overflow-y-auto">
              <div className="px-4 py-4">
                {/* Selected filters chips (always above lists when not in Filters) */}
                {selectedTags.length > 0 && panel !== "filters" && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {selectedTags.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-[#EDE9F5] text-[#4A2574] text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* FILTERS */}
                {panel === "filters" && (
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={nsfwOk} onChange={e=>setNsfwOk(e.target.checked)} />
                        Include NSFW tags
                      </label>
                    </div>
                    <div className="flex flex-wrap">
                      {tags.length === 0 ? (
                        <div className="text-sm text-black/60">Loading tags…</div>
                      ) : (
                        tags.map((t) => <TagChip key={t} t={t} />)
                      )}
                    </div>
                  </div>
                )}

                {/* SEARCH RESULTS */}
                {panel === "search" && (
                  <div>
                    {loading && <div className="text-sm text-black/60">Searching…</div>}
                    {!loading && !text.trim() && (
                      <div className="text-sm text-black/60">Start typing to search anime.</div>
                    )}
                    <ul className="divide-y divide-black/5">
                      {searchResults.map((a) => (
                        <li key={a.id} className="py-3 flex items-center gap-3">
                          {a.main_picture?.medium ? (
                            <img src={a.main_picture.medium} alt={a.title} className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded bg-black/10" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{a.title}</div>
                            {a.total_episodes ? (
                              <div className="text-xs text-black/60">{a.total_episodes} ep</div>
                            ) : null}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => like(a.id)} className="p-2 rounded-full hover:bg-green-100" title="Like">
                              <ThumbsUp className={`h-5 w-5 ${liked.includes(a.id) ? "text-green-700" : "text-green-600"}`} />
                            </button>
                            <button onClick={() => dislike(a.id)} className="p-2 rounded-full hover:bg-red-100" title="Dislike">
                              <ThumbsDown className={`h-5 w-5 ${disliked.includes(a.id) ? "text-red-700" : "text-red-600"}`} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* LISTS */}
                {panel === "lists" && (
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 font-semibold text-sm">Liked</div>
                      <div className="flex flex-wrap gap-2">
                        {liked.length ? liked.map((id) => {
                          const it = itemsById[id];
                          return (
                            <span key={id} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-800 text-xs">
                              <span className="font-medium">{it?.title ?? `#${id}`}</span>
                              <button onClick={() => removeFromLiked(id)} className="p-1 rounded hover:bg-green-100" title="Remove">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          );
                        }) : <span className="text-black/60 text-sm">No likes yet.</span>}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 font-semibold text-sm">Disliked</div>
                      <div className="flex flex-wrap gap-2">
                        {disliked.length ? disliked.map((id) => {
                          const it = itemsById[id];
                          return (
                            <span key={id} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs">
                              <span className="font-medium">{it?.title ?? `#${id}`}</span>
                              <button onClick={() => removeFromDisliked(id)} className="p-1 rounded hover:bg-red-100" title="Remove">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          );
                        }) : <span className="text-black/60 text-sm">No dislikes yet.</span>}
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => { setLiked([]); setDisliked([]); }}
                        className="px-3 py-2 rounded bg-black/5 text-sm"
                      >
                        Clear
                      </button>
                      <button
                        onClick={sendForRecs}
                        className="ml-auto px-4 py-2 rounded bg-[#924DBF] text-white hover:opacity-90 text-sm"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {/* RECOMMENDATIONS */}
                {panel === "recs" && (
                    <div className="max-h-[45vh] overflow-y-auto">
                        {loading && <div className="text-sm text-black/60">Scoring…</div>}
                        {!loading && recs.length === 0 && (
                        <div className="text-sm text-black/60">
                            No recommendations yet — try liking a few titles or adding tags.
                        </div>
                        )}
                        <ul className="divide-y divide-black/5">
                        {recs.map((r) => (
                            <div
                                key={r.anime.id}
                                className="flex items-start gap-4 p-4 border-b border-gray-200"
                            >
                                {/* Anime Image */}
                                <img
                                src={r.anime.main_picture?.medium || ""}
                                alt={r.anime.title}
                                className="w-20 h-28 object-cover rounded-md flex-shrink-0"
                                />

                                {/* Anime Info */}
                                <div className="flex flex-col flex-1">
                                <h3 className="font-semibold text-lg">{r.anime.title}</h3>

                                {/* Episode Count */}
                                {r.anime.total_episodes !== undefined && (
                                    <p className="text-sm text-gray-500">
                                    Episodes: {r.anime.total_episodes || "Unknown"}
                                    </p>
                                )}

                                {/* Synopsis */}
                                <p className="text-sm text-gray-700 mt-1">
                                    {truncateText(r.anime.synopsis || "", window.innerWidth < 768 ? 80 : 160)}
                                </p>

                                {/* Tags */}
                                {r.reason?.overlap_tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                    {r.reason.overlap_tags.map((tag, i) => (
                                        <span
                                        key={i}
                                        className="px-2 py-1 text-xs rounded-full bg-purple-200 text-purple-800"
                                        >
                                        {tag}
                                        </span>
                                    ))}
                                    </div>
                                )}
                                </div>
                            </div>
                            ))}
                        </ul>
                    </div>
                )}
                </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
