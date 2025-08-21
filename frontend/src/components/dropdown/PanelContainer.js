import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
const PanelContainer = forwardRef(function PanelContainer({ children }, ref) {
    return (_jsx("div", { ref: ref, className: "\r\n        relative z-10 w-full -mt-[34px] pt-[34px]\r\n        bg-white text-black shadow-xl rounded-t-none rounded-b-2xl\r\n        max-h-[60vh] overflow-y-auto px-2 sm:px-0\r\n      ", children: _jsx("div", { className: "px-4 py-4", children: children }) }));
});
export default PanelContainer;
