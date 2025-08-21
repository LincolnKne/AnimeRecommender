import TagChip from "../search/TagChip";

export default function FiltersPanel({
  tags, selected, onToggle,
}: { tags: string[]; selected: string[]; onToggle: (t: string) => void; }) {
  return (
    <div className="flex flex-wrap">
      {tags.length === 0
        ? <div className="text-sm text-black/60">Loading tags…</div>
        : tags.map((t) => (
            <TagChip key={t} tag={t} active={selected.includes(t)} onToggle={onToggle} />
          ))
      }
    </div>
  );
}
