import { jsx as _jsx } from "react/jsx-runtime";
import TagChip from "../search/TagChip";
export default function FiltersPanel({ tags, selected, onToggle, }) {
    return (_jsx("div", { className: "flex flex-wrap", children: tags.length === 0
            ? _jsx("div", { className: "text-sm text-black/60", children: "Loading tags\u2026" })
            : tags.map((t) => (_jsx(TagChip, { tag: t, active: selected.includes(t), onToggle: onToggle }, t))) }));
}
