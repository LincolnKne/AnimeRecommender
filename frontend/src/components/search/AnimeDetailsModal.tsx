import type { SearchItem } from "@/lib/types";

export default function AnimeDetailsModal({
  anime, onClose,
}: { anime: SearchItem | null; onClose: () => void; }) {
  if (!anime) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 p-4 flex flex-col items-center">
            {anime.main_picture?.large || anime.main_picture?.medium ? (
              <img
                src={anime.main_picture.large ?? anime.main_picture!.medium}
                alt={anime.title}
                className="w-full h-auto rounded-lg object-cover"
              />
            ) : <div className="w-full aspect-[3/4] rounded-lg bg-black/10" />}
            {!!anime.all_titles?.length && (
              <div className="mt-4 w-full">
                <h4 className="font-semibold text-sm mb-2 text-black">Alternate Titles</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  {anime.all_titles.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div className="w-full md:w-2/3 p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-2 text-black">{anime.title}</h2>
            {anime.total_episodes !== undefined && (
              <p className="text-sm text-gray-500 mb-2">Episodes: {anime.total_episodes || "Unknown"}</p>
            )}
            {!!anime.tags?.length && (
              <div className="flex flex-wrap gap-2 mb-4">
                {anime.tags.map((t, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-purple-200 text-purple-800">{t}</span>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-700 whitespace-pre-line flex-1">
              {anime.synopsis || "No synopsis available."}
            </p>
            <button onClick={onClose} className="mt-4 self-end px-4 py-2 rounded bg-[#924DBF] text-white hover:opacity-90 text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
