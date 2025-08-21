import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import PanelContainer from "../dropdown/PanelContainer";
import FiltersPanel from "../dropdown/FiltersPanel";
import SearchResultsPanel from "../dropdown/SearchResultsPanel";
import ListsPanel from "../dropdown/ListsPanel";
import RecsPanel from "../dropdown/RecsPanel";
import AnimeDetailsModal from "./AnimeDetailsModal";
import TutorialPopup from "./TutorialPopup";
import { api } from "@/lib/api";
import { matchesQuery } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
export default function HeaderSearch() {
    const [open, setOpen] = useState(false);
    const [inputMode, setInputMode] = useState("search");
    const [panel, setPanel] = useState("search");
    const [prevPanel, setPrevPanel] = useState("search");
    const [text, setText] = useState("");
    const debouncedText = useDebouncedValue(text, 250);
    const [loading, setLoading] = useState(false);
    const [nsfwOk, setNsfwOk] = useState(false);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [queries, setQueries] = useState([]);
    const [allTags, setAllTags] = useState({ sfw: [], nsfw: [] });
    const [searchResults, setSearchResults] = useState([]);
    const [itemsById, setItemsById] = useState({});
    const [liked, setLiked] = useState([]);
    const [disliked, setDisliked] = useState([]);
    const [recs, setRecs] = useState([]);
    const [selectedAnime, setSelectedAnime] = useState(null);
    const recsPanelRef = useRef(null);
    const [showTutorial, setShowTutorial] = useState(false);
    // Show on first visit
    useEffect(() => {
        const seen = localStorage.getItem("tutorial_seen");
        if (!seen) {
            setShowTutorial(true);
            localStorage.setItem("tutorial_seen", "true");
        }
    }, []);
    const [watched, setWatched] = useState(() => {
        // Load from localStorage on init
        const stored = localStorage.getItem("watchedAnime");
        return stored ? JSON.parse(stored) : [];
    });
    const hasLists = liked.length > 0 || disliked.length > 0;
    useBodyScrollLock(open); // prevents two scrollbars
    // ---- Index helper ----
    const indexItems = (items) => {
        setItemsById((prev) => {
            const next = { ...prev };
            for (const it of items)
                next[it.id] = it;
            return next;
        });
    };
    // ---- Watched Anime List / Storage ----
    useEffect(() => {
        localStorage.setItem("watchedAnime", JSON.stringify(watched));
    }, [watched]);
    const markWatched = (id) => {
        // Find the anime object in recs
        const anime = recs.find(r => r.anime.id === id)?.anime;
        if (anime) {
            setItemsById(prev => ({ ...prev, [id]: anime }));
        }
        setWatched(prev => [...new Set([...prev, id])]);
        setRecs(prev => prev.filter(r => r.anime.id !== id));
    };
    const unmarkWatched = (id) => {
        setWatched(prev => prev.filter(x => x !== id));
    };
    // After watched is initialized
    useEffect(() => {
        if (watched.length > 0) {
            Promise.all(watched.map(id => api.animeById(id)))
                .then(animeList => {
                setItemsById(prev => {
                    const next = { ...prev };
                    animeList.forEach(anime => {
                        next[anime.id] = anime;
                    });
                    return next;
                });
            })
                .catch(() => {
                // Optional: handle errors if needed
            });
        }
    }, []); // Run once on mount
    // ---- Fetch tags on mount / nsfw toggle ----
    useEffect(() => {
        // Fetch both NSFW states once on mount
        Promise.all([api.config(false), api.config(true)])
            .then(([sfw, nsfw]) => {
            setAllTags({ sfw: sfw.tags, nsfw: nsfw.tags });
            setTags(nsfwOk ? nsfw.tags : sfw.tags);
        })
            .catch(() => {
            setAllTags({ sfw: [], nsfw: [] });
            setTags([]);
        });
    }, []); // only runs once on mount
    useEffect(() => {
        setTags(nsfwOk ? allTags.nsfw : allTags.sfw);
    }, [nsfwOk, allTags]);
    // ---- Debounced search (search mode only) ----
    useEffect(() => {
        if (inputMode !== "search")
            return;
        if (!debouncedText.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        api.search(debouncedText, 20, nsfwOk)
            .then((data) => {
            const filtered = data.filter(a => !liked.includes(a.id) && !disliked.includes(a.id));
            setSearchResults(filtered);
            indexItems(filtered);
            setPanel("search");
            setOpen(true);
        })
            .catch(() => setSearchResults([]))
            .finally(() => setLoading(false));
    }, [debouncedText, inputMode, liked, disliked, nsfwOk]);
    // ---- Panel rules based on lists presence ----
    useEffect(() => {
        if (hasLists && panel !== "filters") {
            setPanel("lists");
            setOpen(true);
        }
        else if (!hasLists && panel === "lists") {
            setPanel(text.trim() ? "search" : "filters");
        }
    }, [hasLists]); // eslint-disable-line
    // ---- Actions ----
    const addQuery = (q) => {
        const t = q.trim();
        if (t && !queries.includes(t)) {
            setQueries((prev) => [...prev, t]);
            setText("");
        }
    };
    const removeQuery = (q) => setQueries((prev) => prev.filter((x) => x !== q));
    const like = (id) => {
        setLiked((prev) => [...new Set([...prev, id])]);
        setDisliked((prev) => prev.filter((x) => x !== id));
        setSearchResults((prev) => prev.filter((x) => x.id !== id));
    };
    const dislike = (id) => {
        setDisliked((prev) => [...new Set([...prev, id])]);
        setLiked((prev) => prev.filter((x) => x !== id));
        setSearchResults((prev) => prev.filter((x) => x.id !== id));
    };
    const removeFromLiked = (id) => {
        setLiked((prev) => prev.filter((x) => x !== id));
        const item = itemsById[id];
        if (item && inputMode === "search" && matchesQuery(item.title, text)) {
            setSearchResults((prev) => [item, ...prev.filter((x) => x.id !== id)]);
        }
    };
    const removeFromDisliked = (id) => {
        setDisliked((prev) => prev.filter((x) => x !== id));
        const item = itemsById[id];
        if (item && inputMode === "search" && matchesQuery(item.title, text)) {
            setSearchResults((prev) => [item, ...prev.filter((x) => x.id !== id)]);
        }
    };
    const toggleMode = () => {
        const next = inputMode === "search" ? "query" : "search";
        setInputMode(next);
        if (next === "query") {
            setPanel("lists");
            setOpen(true);
        }
        else {
            if (text.trim()) {
                setPanel("search");
                setOpen(true);
            }
            else {
                setOpen(false);
            }
        }
    };
    const toggleFilters = () => {
        if (panel === "filters" && open) {
            setPanel(prevPanel);
            setOpen(true);
        }
        else {
            setPrevPanel(panel);
            setPanel("filters");
            setOpen(true);
        }
    };
    const onEnter = () => {
        if (inputMode === "query") {
            addQuery(text);
            setPanel("lists");
            setOpen(true);
        }
        else if (hasLists) {
            sendForRecs();
        }
        else if (text.trim()) {
            setOpen(true);
            setPanel("search");
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
                exclude_ids: [...watched],
                limit: 20,
            };
            const data = await api.recommend(payload);
            setRecs(data);
            setPanel("recs");
            setOpen(true);
        }
        finally {
            setLoading(false);
        }
    };
    const sendForMoreRecs = async () => {
        if (recsPanelRef.current) {
            var prevScrollTop = recsPanelRef.current.scrollTop;
        }
        setLoading(true);
        try {
            const payload = {
                query: inputMode === "query" ? queries.join(" ") : undefined,
                liked_ids: liked,
                disliked_ids: disliked,
                moods: selectedTags,
                nsfw_ok: nsfwOk,
                exclude_ids: [...watched, ...recs.map(r => r.anime.id)],
                limit: 20,
            };
            const more = await api.recommendMore(payload);
            setRecs(prev => [...prev, ...more]);
            // Restore scroll position after the DOM updates
            requestAnimationFrame(() => {
                if (recsPanelRef.current) {
                    recsPanelRef.current.scrollTop = prevScrollTop;
                }
            });
        }
        finally {
            setLoading(false);
        }
    };
    const openAnime = async (id) => {
        try {
            const data = await api.animeById(id);
            setSelectedAnime(data);
        }
        catch { /* noop */ }
    };
    // ---- Render ----
    return (_jsxs("section", { className: "relative min-h-screen flex flex-col items-center justify-start bg-[url('/background2.jpg')] bg-cover bg-center text-white", children: [_jsx(AnimeDetailsModal, { anime: selectedAnime, onClose: () => setSelectedAnime(null) }), _jsx("div", { className: "absolute inset-0 custom-gradient pointer-events-none" }), _jsx("div", { className: "absolute top-6 right-6 z-20", children: _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: nsfwOk, onChange: (e) => setNsfwOk(e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-[#4A2574] transition-colors duration-200", children: _jsx("div", { className: `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${nsfwOk ? "translate-x-6" : ""}` }) }), _jsx("span", { className: "ml-3 text-sm font-medium text-white", children: "NSFW" })] }) }), _jsx("button", { onClick: () => setShowTutorial(true), className: "absolute top-6 left-6 z-30 \r\n                  bg-[#6b32a1] hover:bg-[#4A2574] \r\n                  text-white text-sm font-medium \r\n                  px-5 py-2 rounded-full \r\n                  shadow-md transition-colors duration-200", children: "Tutorial" }), showTutorial && _jsx(TutorialPopup, { onClose: () => setShowTutorial(false) }), _jsxs("div", { className: "relative z-10 w-full max-w-4xl px-4 sm:w-[56vw] mt-[8vh] md:mt-[12vh] lg:mt-[16vh]", children: [_jsx("h1", { className: "text-center font-extrabold mb-8 text-[clamp(2.75rem,5vw,4.25rem)] drop-shadow-[2px_2px_8px_rgba(0,0,0,0.85)]", children: "Anime Recommender" }), _jsxs("div", { className: "relative w-full", children: [_jsx("div", { onClick: toggleFilters, className: "absolute right-0 top-0 h-16 w-16 cursor-pointer z-30" }), _jsx(SearchBar, { inputMode: inputMode, text: text, onText: setText, onToggleMode: toggleMode, onFocusSearch: () => { if (inputMode === "search") {
                                    setPanel("search");
                                    setOpen(true);
                                } }, onEnter: onEnter, filtersOpen: panel === "filters" && open }), open && (_jsxs(PanelContainer, { ref: recsPanelRef, children: [panel === "filters" && (_jsx(FiltersPanel, { tags: tags, selected: selectedTags, onToggle: (t) => setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]) })), panel === "search" && (_jsx(SearchResultsPanel, { results: searchResults, liked: liked, disliked: disliked, watched: watched, onLike: like, onDislike: dislike, onMarkWatched: markWatched, onOpenAnime: openAnime, loading: loading })), panel === "lists" && (_jsx(ListsPanel, { tags: selectedTags, queries: queries, liked: liked, disliked: disliked, watched: watched, itemsById: itemsById, onRemoveQuery: removeQuery, onRemoveLiked: removeFromLiked, onRemoveDisliked: removeFromDisliked, onRemoveWatched: unmarkWatched, onClear: () => { setLiked([]); setDisliked([]); setQueries([]); setSelectedTags([]); }, onSend: sendForRecs })), panel === "recs" && (_jsx(RecsPanel, { recs: recs, watched: watched, loading: loading, onOpenAnime: openAnime, onMore: sendForMoreRecs, onMarkWatched: markWatched }))] }))] })] }), _jsx("footer", { className: "absolute bottom-2 w-full text-center text-xs text-white/70", children: _jsx("a", { href: "https://github.com/LincolnKne/AnimeRecommender/issues", target: "_blank", rel: "noopener noreferrer", className: "underline hover:text-white", children: "Report an issue on GitHub" }) })] }));
}
