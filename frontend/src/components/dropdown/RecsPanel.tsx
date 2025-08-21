import type { ScoredAnime } from "@/lib/types";
import { truncate } from "@/lib/utils";
import { Eye } from "lucide-react";

export default function RecsPanel({
  recs, loading, watched, onOpenAnime, onMore, onMarkWatched,
}: {
  recs: ScoredAnime[];
  loading: boolean;
  watched: number[];
  onOpenAnime: (id: number) => void;
  onMore: () => void;
  onMarkWatched: (id: number) => void;
}) {
  const synopsisLen = window.innerWidth < 768 ? 80 : 160;

  if (loading) {
    return <div className="text-sm text-black/60">Scoring…</div>;
  }

  if (!recs.length) {
    return (
      <div className="text-sm text-black/60">
        No recommendations yet — try liking a few titles or adding tags.
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-black/5">
        {recs.map((r) => (
          <li
            key={r.anime.id}
            className="flex items-start gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            onClick={() => onOpenAnime(r.anime.id)}
          >
            <img
              src={r.anime.main_picture?.medium || ""}
              alt={r.anime.title}
              className="w-20 h-28 object-cover rounded-md flex-shrink-0"
            />
            <div className="flex flex-col flex-1">
              <h3 className="font-semibold text-lg">{r.anime.title}</h3>
              {r.anime.total_episodes !== undefined && (
                <p className="text-sm text-gray-500">
                  Episodes: {r.anime.total_episodes || "Unknown"}
                </p>
              )}
              <p className="text-sm text-gray-700 mt-1">
                {truncate(r.anime.synopsis || "", synopsisLen)}
              </p>
              {!!r.reason?.overlap_tags?.length && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {r.reason.overlap_tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-purple-200 text-purple-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 ml-2">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onMarkWatched(r.anime.id); 
                }}
                className="p-2 rounded-full hover:bg-blue-100"
                title="Mark as Watched"
              >
                <Eye
                  className={`h-5 w-5 ${watched.includes(r.anime.id) ? "text-blue-700" : "text-purple-800"}`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {recs.length > 0 && (
        <div className="p-4 flex justify-center">
          <button
            onClick={onMore}
            className="px-4 py-2 rounded bg-[#924DBF] text-white hover:opacity-90 text-sm"
          >
            Recommend More
          </button>
        </div>
        
      )}
    </>
  );
}
