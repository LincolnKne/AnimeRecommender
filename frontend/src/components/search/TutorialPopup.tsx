import { useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const steps = [
  {
    img: "/tutorial/step1.png",
    text: "Search by anime titles, or switch to query mode to describe what you want (moods, vibes, themes, etc.). Turn on the NSFW toggle if you want to include NSFW results",
  },
  {
    img: "/tutorial/step2.png",
    text: "Click the chevron to open the filter panel, then use filters to refine results and match your mood. (NSFW-related filters only appear if the NSFW toggle is enabled.)",
  },
  {
    img: "/tutorial/step3.png",
    text: "The query tab collects your filters, queries, and liked/disliked/watched anime. When you’re ready, press Send to receive recommendations.",
  },
];

export default function TutorialPopup({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // threshold of 50px swipe
    if (diff > 50 && step < steps.length - 1) {
      setStep((s) => s + 1); // swipe left → next
    } else if (diff < -50 && step > 0) {
      setStep((s) => s - 1); // swipe right → back
    }
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className={`
          relative bg-white rounded-2xl shadow-xl flex flex-col
          w-full max-w-3xl max-h-[85vh] m-4
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-gray-500 hover:text-black"
        >
          <X size={22} />
        </button>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center px-6 pt-10 pb-6">
          <img
            src={steps[step].img}
            alt={`Step ${step + 1}`}
            className="max-h-[50vh] max-w-[90%] object-contain rounded-lg"
          />
        </div>

        {/* Text */}
        <p className="text-center text-gray-700 px-6 pb-4 text-base sm:text-lg">
          {steps[step].text}
        </p>

        {/* Navigation */}
        <div className="flex justify-between items-center border-t p-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-[#4A2574] disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <span className="text-sm text-gray-500">
            {step + 1} / {steps.length}
          </span>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-[#4A2574] text-white"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1 text-sm rounded bg-[#4A2574] text-white"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
