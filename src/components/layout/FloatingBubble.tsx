import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { GlassSurface } from "../glass/GlassSurface";
import { useAppStore } from "../../store/useAppStore";

interface FloatingBubbleProps {
  onExpand: () => void;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({ onExpand }) => {
  const isPinned = useAppStore((s) => s.isPinned);
  const savedWords = useAppStore((s) => s.savedWords);
  const settings = useAppStore((s) => s.settings);
  const [isHovered, setIsHovered] = useState(false);

  const now = new Date();
  const dueCount = savedWords.filter(
    (w) => !w.isKnown && new Date(w.fsrs.due).getTime() <= now.getTime()
  ).length;

  return (
    <button
      type="button"
      data-no-window-drag
      className="relative w-full h-full flex items-center justify-center select-none bg-transparent border-0 p-0 cursor-pointer group"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onExpand}
      aria-label="Mở lại LexiGlass"
      title={`Mở lại LexiGlass · ${settings.globalShortcut}`}
    >
      {/* In browser preview there is enough room for a tooltip. The native
          72×72 bubble intentionally stays clean so nothing is cropped. */}
      {isHovered && typeof document !== "undefined" && !document.documentElement.classList.contains("tauri-runtime") && (
        <div className="absolute right-[68px] px-3 py-1 rounded-xl lexi-glass-panel text-xs text-slate-200 shadow-xl flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
          <span className="font-semibold text-sky-200">LexiGlass</span>
          <span className="text-[11px] text-slate-400 font-mono">({settings.globalShortcut})</span>
        </div>
      )}

      <GlassSurface
        variant="floating"
        glow
        className="w-14 h-14 flex items-center justify-center relative hover:scale-[1.035] active:scale-95 transition-transform duration-150 pointer-events-none"
      >
        <BookOpen className="w-6 h-6 text-sky-200" />

        {dueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-sky-200 text-[10px] font-bold text-slate-900 border border-white/70 shadow-sm">
            {dueCount}
          </span>
        )}

        {isPinned && (
          <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-slate-900/50" />
        )}
      </GlassSurface>
    </button>
  );
};
