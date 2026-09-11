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

  // Count words due
  const now = new Date();
  const dueCount = savedWords.filter(
    (w) => !w.isKnown && new Date(w.fsrs.due).getTime() <= now.getTime()
  ).length;

  return (
    <div
      className="fixed right-6 bottom-12 z-50 flex items-center gap-2.5 group cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onExpand}
    >
      {/* Subtle hover tooltip */}
      {isHovered && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-150 px-3 py-1 rounded-xl lexi-glass-panel text-xs text-slate-200 shadow-xl flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-semibold text-cyan-300">LexiGlass</span>
          <span className="text-[11px] text-slate-400 font-mono">({settings.globalShortcut})</span>
        </div>
      )}

      {/* 56x56 Floating Bubble */}
      <GlassSurface
        variant="floating"
        glow
        className="w-14 h-14 flex items-center justify-center relative hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        <BookOpen className="w-6 h-6 text-cyan-300 drop-shadow-[0_2px_8px_rgba(6,182,212,0.6)]" />

        {/* Small due review count badge */}
        {dueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-bold text-slate-950 border border-white/50 shadow-md">
            {dueCount}
          </span>
        )}

        {/* Always-on-top indicator */}
        {isPinned && (
          <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900/60" />
        )}
      </GlassSurface>
    </div>
  );
};
