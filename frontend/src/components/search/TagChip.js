import { jsx as _jsx } from "react/jsx-runtime";
export default function TagChip({ tag, active, onToggle, }) {
    return (_jsx("button", { onClick: () => onToggle(tag), className: `px-3 py-1 rounded-full text-sm mr-2 mb-2 transition ${active ? "bg-[#924DBF] text-white" : "bg-black/5 text-[#4A2574] hover:bg-black/10"}`, children: tag }));
}
