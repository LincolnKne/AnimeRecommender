import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, ChevronDown, ThumbsUp, ThumbsDown, X } from "lucide-react";

/** Backend base URL via env */
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* ---- Types ---- */
type SearchItem = {
  id: number;
  title: string;
  all_titles?: string[];
  tags?: string[];
  main_picture?: { medium: string; large: string };
  synopsis?: string;
  total_episodes?: number;
  is_nsfw?: boolean;
};

type ScoredAnime = {
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
  const [selectedAnime, setSelectedAnime] = useState<SearchItem | null>(null);

  // liked/disliked
  const [liked, setLiked] = useState<number[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]);
  const hasLists = liked.length > 0 || disliked.length > 0;

  const [queries, setQueries] = useState<string[]>([]);
  const [prevPanel, setPrevPanel] = useState<PanelMode>("search");

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


  const addQuery = (q: string) => {
    const trimmed = q.trim();
    if (trimmed && !queries.includes(trimmed)) {
      setQueries(prev => [...prev, trimmed]);
      setText("");
    }
  };
  const removeQuery = (q: string) => {
    setQueries(prev => prev.filter(x => x !== q));
  };
  
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
          `${BASE_URL}/api/search?q=${encodeURIComponent(text)}&limit=20&nsfw_ok=${nsfwOk ? "true" : "false"}`
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

  /* ---------- fetch tags and anime (on mount / nsfw toggle) ---------- */
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

  async function fetchAnimeDetails(id: number) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/anime/${id}`);
    if (!res.ok) throw new Error("Failed to fetch anime details");
    const data = await res.json();
    setSelectedAnime(data);
  } catch (err) {
    console.error(err);
  }
}


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
      // Always show the lists panel when switching to query mode
      setPanel("lists");
      setOpen(true);
    } else {
      // Back to search mode
      if (text.trim()) {
        setPanel("search");
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
  };

  const openFilters = () => {
    if (panel === "filters" && open) {
      // Close filters and restore previous panel
      setPanel(prevPanel);
      setOpen(true); // keep dropdown open
    } else {
      // Store current panel before switching
      setPrevPanel(panel);
      setPanel("filters");
      setOpen(true);
    }
  };


  const sendForRecs = async () => {
    setLoading(true);
    try {
      const payload = {
        query: inputMode === "query" ? queries.join(" ") : undefined,
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
      {selectedAnime && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg">
            <div className="flex flex-col md:flex-row">
              {/* Left side: big image and alternate titles */}
              <div className="w-full md:w-1/3 p-4 flex flex-col items-center">
                <img
                  src={selectedAnime.main_picture?.large || selectedAnime.main_picture?.medium || ""}
                  alt={selectedAnime.title}
                  className="w-full h-auto rounded-lg object-cover"
                />
                {selectedAnime.all_titles && selectedAnime.all_titles.length > 0 && (
                  <div className="mt-4 w-full">
                    <h4 className="font-semibold text-sm mb-2 text-black">Alternate Titles</h4>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {selectedAnime.all_titles.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right side: title, episodes, tags, synopsis */}
              <div className="w-full md:w-2/3 p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-2 text-black">{selectedAnime.title}</h2>

                {selectedAnime.total_episodes !== undefined && (
                  <p className="text-sm text-gray-500 mb-2">
                    Episodes: {selectedAnime.total_episodes || "Unknown"}
                  </p>
                )}

                {selectedAnime.tags && selectedAnime.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedAnime.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-purple-200 text-purple-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-700 whitespace-pre-line flex-1">
                  {selectedAnime.synopsis || "No synopsis available."}
                </p>

                <button
                  onClick={() => setSelectedAnime(null)}
                  className="mt-4 self-end px-4 py-2 rounded bg-[#924DBF] text-white hover:opacity-90 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gradient overlay: solid bottom then fade up */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#4A2574]/100 via-[#4A2574]/100 via-[55%] to-transparent pointer-events-none"></div>

      {/* NSFW Toggle Switch */}
      <div className="absolute top-6 right-6 z-20">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={nsfwOk}
            onChange={(e) => setNsfwOk(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#924DBF] transition-colors duration-200">
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${nsfwOk ? "translate-x-6" : ""}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-black">NSFW</span>
        </label>
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 sm:w-[56vw] mt-[8vh] md:mt-[12vh] lg:mt-[16vh]">
        <h1 className="text-center font-extrabold mb-8 text-[clamp(2.75rem,5vw,4.25rem)] text-white">
          Anime Recommender
        </h1>

        <div className="relative w-full">
          {/* SEARCH BAR */}
          <div className="relative z-20 flex items-stretch h-14 sm:h-16 rounded-full overflow-hidden
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
                    if (inputMode === "query") {
                      addQuery(text);          // add typed query to list
                      setPanel("lists");       // show the lists panel
                      setOpen(true);           // keep dropdown open
                    } else if (hasLists) {
                      sendForRecs();           // in search mode with likes/dislikes
                    } else if (inputMode === "search" && text.trim()) {
                      setOpen(true);           // just open search results
                    }
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
            <div className="
              relative z-10 w-full -mt-[34px] pt-[34px]
              bg-white text-black shadow-xl rounded-t-none rounded-b-2xl
              max-h-[60vh] overflow-y-auto
              px-2 sm:px-0
            ">
              <div className="px-4 py-4">
                {/* FILTERS */}
                {panel === "filters" && (
                  <div>
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
                        <li
                          key={a.id}
                          className="py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                        >
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
                      <div className="mb-2 font-semibold text-sm">Selected Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.length ? (
                          selectedTags.map((t) => (
                            <span
                              key={t}
                              className="px-3 py-1 rounded-full bg-[#EDE9F5] text-[#4A2574] text-xs"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-black/60 text-sm">No tags selected yet.</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 font-semibold text-sm">Queries</div>
                      <div className="flex flex-wrap gap-2">
                        {queries.length ? queries.map((q) => (
                          <span key={q} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs">
                            <span className="font-medium">{q}</span>
                            <button
                              onClick={() => removeQuery(q)}
                              className="p-1 rounded hover:bg-blue-100"
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        )) : <span className="text-black/60 text-sm">No queries yet.</span>}
                      </div>
                    </div>
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
                      <button onClick={() => { setLiked([]); setDisliked([]); setQueries([]); setSelectedTags([]);}} className="px-3 py-2 rounded bg-black/5 text-sm">Clear</button>
                      <button onClick={sendForRecs} className="ml-auto px-4 py-2 rounded bg-[#924DBF] text-white hover:opacity-90 text-sm">Send</button>
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
                              className="flex items-start gap-4 p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                              onClick={() => fetchAnimeDetails(r.anime.id)}
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
