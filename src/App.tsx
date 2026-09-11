import React, { useEffect } from "react";
import { useAppStore, store } from "./store/useAppStore";
import { desktopBridge } from "./services/desktop/desktopBridge";
import { FloatingBubble } from "./components/layout/FloatingBubble";
import { QuickLookup } from "./components/dictionary/QuickLookup";
import { FullStudyWindow } from "./components/study/FullStudyWindow";
import { DesktopSimulator } from "./components/layout/DesktopSimulator";

export default function App() {
  const windowMode = useAppStore((s) => s.windowMode);
  const settings = useAppStore((s) => s.settings);

  // Initialize storage, demo word, and shortcut listener
  useEffect(() => {
    store.init();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D triggers capture and quick lookup
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

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans antialiased text-slate-100">
      {/* Background: If in browser preview, show the realistic desktop simulator.
          If in native Tauri window, keep background completely transparent for Windows Acrylic blur! */}
      {!desktopBridge.isTauri ? (
        <>
          {/* Deep dark desktop wallpaper with subtle ambient aura */}
          <div className="absolute inset-0 bg-[#090d16] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,116,144,0.18),rgba(255,255,255,0))]" />
          <DesktopSimulator />
        </>
      ) : (
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
      )}

      {/* Floating Glass Application Layer */}
      <div className="relative z-40 transition-all duration-300 ease-out flex items-center justify-center p-4">
        {/* Mode 1: Floating Bubble */}
        {windowMode === "bubble" && (
          <FloatingBubble onExpand={() => store.setWindowMode("lookup")} />
        )}

        {/* Mode 2: Quick Lookup Window (420px floating popup) */}
        {windowMode === "lookup" && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <QuickLookup />
          </div>
        )}

        {/* Mode 3: Full Study Window (900x650px) */}
        {windowMode === "study" && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <FullStudyWindow />
          </div>
        )}
      </div>
    </div>
  );
}
