import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { truncate } from "@/lib/utils";
import { Eye } from "lucide-react";
export default function RecsPanel({ recs, loading, watched, onOpenAnime, onMore, onMarkWatched, }) {
    const synopsisLen = window.innerWidth < 768 ? 80 : 160;
    if (loading) {
        return _jsx("div", { className: "text-sm text-black/60", children: "Scoring\u2026" });
    }
    if (!recs.length) {
        return (_jsx("div", { className: "text-sm text-black/60", children: "No recommendations yet \u2014 try liking a few titles or adding tags." }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("ul", { className: "divide-y divide-black/5", children: recs.map((r) => (_jsxs("li", { className: "flex items-start gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer", onClick: () => onOpenAnime(r.anime.id), children: [_jsx("img", { src: r.anime.main_picture?.medium || "", alt: r.anime.title, className: "w-20 h-28 object-cover rounded-md flex-shrink-0" }), _jsxs("div", { className: "flex flex-col flex-1", children: [_jsx("h3", { className: "font-semibold text-lg", children: r.anime.title }), r.anime.total_episodes !== undefined && (_jsxs("p", { className: "text-sm text-gray-500", children: ["Episodes: ", r.anime.total_episodes || "Unknown"] })), _jsx("p", { className: "text-sm text-gray-700 mt-1", children: truncate(r.anime.synopsis || "", synopsisLen) }), !!r.reason?.overlap_tags?.length && (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: r.reason.overlap_tags.map((t, i) => (_jsx("span", { className: "px-2 py-1 text-xs rounded-full bg-purple-200 text-purple-800", children: t }, i))) }))] }), _jsx("div", { className: "flex flex-col gap-2 ml-2", children: _jsx("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    onMarkWatched(r.anime.id);
                                }, className: "p-2 rounded-full hover:bg-blue-100", title: "Mark as Watched", children: _jsx(Eye, { className: `h-5 w-5 ${watched.includes(r.anime.id) ? "text-blue-700" : "text-purple-800"}` }) }) })] }, r.anime.id))) }), recs.length > 0 && (_jsx("div", { className: "p-4 flex justify-center", children: _jsx("button", { onClick: onMore, className: "px-4 py-2 rounded bg-[#924DBF] text-white hover:opacity-90 text-sm", children: "Recommend More" }) }))] }));
}
