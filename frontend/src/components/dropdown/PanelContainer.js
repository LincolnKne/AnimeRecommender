import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
const PanelContainer = forwardRef(function PanelContainer({ children }, ref) {
    return (_jsx("div", { ref: ref, className: "\r\n      relative z-10 w-full -mt-[34px] pt-[34px]\r\n      bg-white text-black shadow-xl rounded-t-none rounded-b-2xl\r\n      max-h-[80vh] sm:max-h-[70vh] md:max-h-[65vh] lg:max-h-[60vh]\r\n      overflow-y-auto px-2 sm:px-0\r\n      mb-6\r\n    ", children: _jsx("div", { className: "px-4 py-4", children: children }) }));
});
export default PanelContainer;
