import React from "react";
import { FaMicrophone } from "react-icons/fa";

export default function FloatingVoiceButton({ onClick = () => {} }) {
  return (
    <aside
      aria-label="Voice Assistant Floating Trigger"
      className="fixed bottom-20 md:bottom-6 right-5 z-40 flex items-center group"
    >
      {/* Tooltip on hover */}
      <span className="hidden sm:inline-block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] text-white text-xs font-semibold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        🎙️ Voice AI Logging (Hindi/English)
      </span>

      {/* Floating Circular Button */}
      <button
        type="button"
        onClick={onClick}
        className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-black flex items-center justify-center text-lg sm:text-xl font-bold shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-emerald-300"
        aria-label="Open Voice AI Assistant"
        title="Open Voice AI Assistant"
      >
        {/* Pulsing ring animation */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none opacity-60" />
        <FaMicrophone className="relative z-10" />
      </button>
    </aside>
  );
}
