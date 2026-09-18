import React, { useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { GlassSurface } from "../glass/GlassSurface";
import { useAppStore } from "../../store/useAppStore";
import { desktopBridge } from "../../services/desktop/desktopBridge";

interface FloatingBubbleProps {
  onExpand: () => void;
}

const DRAG_THRESHOLD_PX = 5;

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({ onExpand }) => {
  const isPinned = useAppStore((s) => s.isPinned);
  const savedWords = useAppStore((s) => s.savedWords);
  const settings = useAppStore((s) => s.settings);
  const [isHovered, setIsHovered] = useState(false);

  const activePointerId = useRef<number | null>(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const now = new Date();
  const dueCount = savedWords.filter(
    (w) => !w.isKnown && new Date(w.fsrs.due).getTime() <= now.getTime()
  ).length;

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;

    activePointerId.current = event.pointerId;
    pointerStart.current = { x: event.clientX, y: event.clientY };
    didDrag.current = false;

    // Keep receiving pointermove events until we hand control to the native
    // window drag operation.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; native dragging still works without it.
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!desktopBridge.isTauri) return;
    if (activePointerId.current !== event.pointerId || didDrag.current) return;

    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

    didDrag.current = true;

    // Release WebView pointer capture before asking Windows/Tauri to take over
    // the drag gesture. Otherwise WebView2 can keep the pointer and the native
    // window never receives the move operation.
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore capture cleanup failures.
    }

    void desktopBridge.startDragging();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore capture cleanup failures.
    }

    activePointerId.current = null;
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Browsers still synthesize a click after a completed drag gesture.
    // Consume that click so dropping the bubble does not expand LexiGlass.
    if (didDrag.current) {
      didDrag.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onExpand();
  };

  return (
    <button
      type="button"
      data-no-window-drag
      className="relative w-full h-full flex items-center justify-center select-none bg-transparent border-0 p-0 cursor-grab active:cursor-grabbing group touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onDragStart={(event) => event.preventDefault()}
      aria-label="Mở hoặc kéo LexiGlass"
      title={`Kéo để di chuyển · Nhấn để mở · ${settings.globalShortcut}`}
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
