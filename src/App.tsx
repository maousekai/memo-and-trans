import React, { useEffect } from "react";
import { useAppStore, store } from "./store/useAppStore";
import { desktopBridge } from "./services/desktop/desktopBridge";
import { FloatingBubble } from "./components/layout/FloatingBubble";
import { QuickLookup } from "./components/dictionary/QuickLookup";
import { FullStudyWindow } from "./components/study/FullStudyWindow";
import { DesktopSimulator } from "./components/layout/DesktopSimulator";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function App() {
  const windowMode = useAppStore((s) => s.windowMode);
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    store.init();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "d" || e.key === "D")
      ) {
        e.preventDefault();
        store.captureSelectedAndLookup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Settings now control the actual material instead of being decorative UI.
  // Higher "transparency" means lower painted alpha, while text contrast stays
  // unchanged. Native Acrylic is provided by Tauri underneath this layer.
  useEffect(() => {
    const root = document.documentElement;
    const transparency = clamp(settings.transparency, 40, 92) / 100;
    const intensity = clamp(settings.glassIntensity, 0, 100) / 100;
    const windowAlpha = clamp(0.43 - transparency * 0.34, 0.11, 0.29);
    const panelAlpha = clamp(0.045 + (1 - transparency) * 0.12, 0.045, 0.13);
    const controlAlpha = clamp(0.065 + (1 - transparency) * 0.14, 0.065, 0.16);
    const highlightAlpha = clamp(0.065 + intensity * 0.075, 0.065, 0.14);

    root.style.setProperty("--glass-window-alpha", windowAlpha.toFixed(3));
    root.style.setProperty("--glass-panel-alpha", panelAlpha.toFixed(3));
    root.style.setProperty("--glass-control-alpha", controlAlpha.toFixed(3));
    root.style.setProperty("--glass-highlight-alpha", highlightAlpha.toFixed(3));
    root.style.setProperty("--glass-blur", `${clamp(settings.blurAmount, 8, 40)}px`);
  }, [
    settings.transparency,
    settings.glassIntensity,
    settings.blurAmount,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans antialiased text-slate-100">
      {!desktopBridge.isTauri ? (
        <>
          <div className="absolute inset-0 lexi-preview-wallpaper" />
          <DesktopSimulator />
        </>
      ) : (
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
      )}

      <div className="relative z-40 transition-all duration-300 ease-out flex items-center justify-center p-4">
        {windowMode === "bubble" && (
          <FloatingBubble onExpand={() => store.setWindowMode("lookup")} />
        )}

        {windowMode === "lookup" && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <QuickLookup />
          </div>
        )}

        {windowMode === "study" && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <FullStudyWindow />
          </div>
        )}
      </div>
    </div>
  );
}
