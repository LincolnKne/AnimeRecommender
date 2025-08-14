import type { ReactNode, ForwardedRef } from "react";
import { forwardRef } from "react";

const PanelContainer = forwardRef(function PanelContainer(
  { children }: { children: ReactNode },
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className="
        relative z-10 w-full -mt-[34px] pt-[34px]
        bg-white text-black shadow-xl rounded-t-none rounded-b-2xl
        max-h-[60vh] overflow-y-auto px-2 sm:px-0
      "
    >
      <div className="px-4 py-4">{children}</div>
    </div>
  );
});

export default PanelContainer;
