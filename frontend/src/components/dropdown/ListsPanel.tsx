import { X } from "lucide-react";

export default function ListsPanel({
  tags, queries, liked, disliked, watched, itemsById,
  onRemoveQuery, onRemoveLiked, onRemoveDisliked, onRemoveWatched,
  onClear, onSend,
}: {
  tags: string[];
  queries: string[];
  liked: number[];
  disliked: number[];
  watched: number[]; // <-- added
  itemsById: Record<number, { title?: string }>;
  onRemoveQuery: (q: string) => void;
  onRemoveLiked: (id: number) => void;
  onRemoveDisliked: (id: number) => void;
  onRemoveWatched: (id: number) => void; 
  onClear: () => void;
  onSend: () => void;
}) {
  const Chip = ({ label, tone, onX }: { label: string; tone: "green" | "red" | "blue"; onX: () => void; }) => {
    const toneMap = {
      green: "bg-green-50 text-green-800 hover:bg-green-100",
      red: "bg-red-50 text-red-800 hover:bg-red-100",
      blue: "bg-blue-50 text-blue-800 hover:bg-blue-100",
    } as const;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${toneMap[tone]}`}>
        <span className="font-medium">{label}</span>
        <button onClick={onX} className="p-1 rounded" title="Remove">
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 font-semibold text-sm">Selected Tags</div>
        <div className="flex flex-wrap gap-2">
          {tags.length ? tags.map((t) => (
            <span key={t} className="px-3 py-1 rounded-full bg-[#EDE9F5] text-[#4A2574] text-xs">{t}</span>
          )) : <span className="text-black/60 text-sm">No tags selected yet.</span>}
        </div>
      </section>

      <section>
        <div className="mb-2 font-semibold text-sm">Queries</div>
        <div className="flex flex-wrap gap-2">
          {queries.length ? queries.map((q) => (
            <Chip key={q} label={q} tone="blue" onX={() => onRemoveQuery(q)} />
          )) : <span className="text-black/60 text-sm">No queries yet.</span>}
        </div>
      </section>

      <section>
        <div className="mb-2 font-semibold text-sm">Liked</div>
        <div className="flex flex-wrap gap-2">
          {liked.length ? liked.map((id) => (
            <Chip key={id} label={itemsById[id]?.title ?? `#${id}`} tone="green" onX={() => onRemoveLiked(id)} />
          )) : <span className="text-black/60 text-sm">No likes yet.</span>}
        </div>
      </section>

      <section>
        <div className="mb-2 font-semibold text-sm">Disliked</div>
        <div className="flex flex-wrap gap-2">
          {disliked.length ? disliked.map((id) => (
            <Chip key={id} label={itemsById[id]?.title ?? `#${id}`} tone="red" onX={() => onRemoveDisliked(id)} />
          )) : <span className="text-black/60 text-sm">No dislikes yet.</span>}
        </div>
      </section>

      <section>
        <div className="mb-2 font-semibold text-sm">Watched</div>
        <div className="flex flex-wrap gap-2">
          {watched.length ? watched.map((id) => (
            <Chip
              key={id}
              label={itemsById[id]?.title ?? `#${id}`}
              tone="blue"
              onX={() => onRemoveWatched(id)}
            />
          )) : <span className="text-black/60 text-sm">No watched anime yet.</span>}
        </div>
      </section>

      <div className="pt-2 flex gap-2">
        <button onClick={onClear} className="px-3 py-2 rounded bg-black/5 text-sm">Clear</button>
        <button onClick={onSend} className="ml-auto px-4 py-2 rounded bg-[#924DBF] text-white hover:opacity-90 text-sm">Send</button>
      </div>
    </div>
  );
}
