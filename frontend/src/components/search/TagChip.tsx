export default function TagChip({
  tag,
  active,
  onToggle,
}: { tag: string; active: boolean; onToggle: (t: string) => void; }) {
  return (
    <button
      onClick={() => onToggle(tag)}
      className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 transition ${
        active ? "bg-[#924DBF] text-white" : "bg-black/5 text-[#4A2574] hover:bg-black/10"
      }`}
    >
      {tag}
    </button>
  );
}
