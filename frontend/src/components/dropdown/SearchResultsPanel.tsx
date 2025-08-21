import type { SearchItem } from "@/lib/types";
import { Eye } from "lucide-react";

export default function SearchResultsPanel({
  results, liked, disliked, watched, onLike, onDislike, onMarkWatched, onOpenAnime, loading,
}: {
  results: SearchItem[];
  liked: number[];
  disliked: number[];
  watched: number[];
  onLike: (id: number) => void;
  onDislike: (id: number) => void;
  onMarkWatched: (id: number) => void;
  onOpenAnime: (id: number) => void;   // NEW
  loading: boolean;
}) {
  return (
    <div>
      {loading && <div className="text-sm text-black/60">Searching…</div>}
      {!loading && results.length === 0 && (
        <div className="text-sm text-black/60">Start typing to search anime.</div>
      )}
      <ul className="divide-y divide-black/5">
        {results.map((a) => (
          <li
            key={a.id}
            className="py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => onOpenAnime(a.id)}   // open modal on row click
          >
            {a.main_picture?.medium ? (
              <img
                src={a.main_picture.medium}
                alt={a.title}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-black/10" />
            )}

            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="font-semibold truncate">{a.title}</div>

              {/* Episodes + alternate titles */}
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                {a.total_episodes ? <span>{a.total_episodes} ep</span> : null}
                {a.all_titles && a.all_titles.length > 0 && (
                  <span className="truncate">{a.all_titles.join(" • ")}</span>
                )}
              </div>
            </div>

            {/* Like/Dislike/Watched buttons */}
            <div
              className="flex gap-1"
              onClick={(e) => e.stopPropagation()} // prevent row click
            >
              <button
                onClick={() => onLike(a.id)}
                className="p-2 rounded-full hover:bg-green-100"
                title="Like"
              >
                <svg
                  className={`h-5 w-5 ${
                    liked.includes(a.id) ? "text-green-700" : "text-green-600"
                  }`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h7c.82 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onDislike(a.id)}
                className="p-2 rounded-full hover:bg-red-100"
                title="Dislike"
              >
                <svg
                  className={`h-5 w-5 ${
                    disliked.includes(a.id) ? "text-red-700" : "text-red-600"
                  }`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15 3H8c-.82 0-1.54.5-1.84 1.22L3.14 11.27c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17-.79.44-1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zM22 3h-4v12h4V3z" />
                </svg>
              </button>
              <button
                onClick={() => onMarkWatched(a.id)}
                className="p-2 rounded-full hover:bg-blue-100"
                title="Mark as Watched"
              >
                <Eye
                  className={`h-5 w-5 ${
                    watched.includes(a.id) ? "text-blue-700" : "text-purple-800"
                  }`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
