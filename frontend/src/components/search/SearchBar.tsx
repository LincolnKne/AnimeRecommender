import { Search as SearchIcon, ChevronDown } from "lucide-react";
import type { InputMode } from "@/lib/types";

export default function SearchBar({
  inputMode, text, onText, onToggleMode, onFocusSearch, onEnter,
  filtersOpen,
}: {
  inputMode: InputMode;
  text: string;
  onText: (s: string) => void;
  onToggleMode: () => void;
  onFocusSearch: () => void;
  onEnter: () => void;
  filtersOpen: boolean;
}) {
  return (
    <div className="relative z-20 flex items-stretch h-14 sm:h-16 rounded-full overflow-hidden
                    bg-[#7338A0] text-white shadow-xl ring-1 ring-black/10
                    focus-within:ring-2 focus-within:ring-[#7338A0]/60">
      <button
        type="button"
        onClick={onToggleMode}
        className="px-5 text-sm font-semibold bg-[#7338A0] hover:bg-[#924DBF] transition rounded-l-full"
        title={inputMode === "search" ? "Switch to Query" : "Switch to Search"}
      >
        {inputMode === "search" ? "Search" : "Query"}
      </button>

      <div className="relative flex-1 flex items-center">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
        <input
          value={text}
          onChange={(e) => onText(e.target.value)}
          onFocus={onFocusSearch}
          onKeyDown={(e) => { if (e.key === "Enter") onEnter(); }}
          type="text"
          placeholder={inputMode === "search"
            ? "Search anime…"
            : "Describe what you want (moods, vibes, titles, etc.)…"}
          className="w-full h-full bg-transparent text-white placeholder-white/70 pl-12 pr-14 border-none outline-none ring-0"
        />
      </div>

      <div className="px-4 flex items-center justify-center">
        <ChevronDown className={`h-5 w-5 transition ${filtersOpen ? "rotate-180" : ""}`} />
      </div>
    </div>
  );
}
