import React, { useEffect } from "react";
import { useAppStore, store } from "./store/useAppStore";
import { desktopBridge } from "./services/desktop/desktopBridge";
import { speechService } from "./services/pronunciation/speechService";
import { FloatingBubble } from "./components/layout/FloatingBubble";
import { QuickLookup } from "./components/dictionary/QuickLookup";
import { FullStudyWindow } from "./components/study/FullStudyWindow";
import { DesktopSimulator } from "./components/layout/DesktopSimulator";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const NON_DRAG_SELECTOR = [
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "a",
  "label",
  "summary",
  "[role='button']",
  "[role='link']",
  "[contenteditable='true']",
  "[data-no-window-drag]",
].join(",");

function isScrollbarHit(target: HTMLElement, clientX: number, clientY: number) {
  let element: HTMLElement | null = target;

  while (element) {
    const rect = element.getBoundingClientRect();
    const verticalScrollable = element.scrollHeight > element.clientHeight + 1;
    const horizontalScrollable = element.scrollWidth > element.clientWidth + 1;

    if (verticalScrollable && clientX >= rect.right - 14 && clientX <= rect.right + 1) {
      return true;
    }

    if (horizontalScrollable && clientY >= rect.bottom - 14 && clientY <= rect.bottom + 1) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("tauri-runtime", desktopBridge.isTauri);
    root.classList.toggle("browser-preview-runtime", !desktopBridge.isTauri);

    return () => {
      root.classList.remove("tauri-runtime", "browser-preview-runtime");
    };
  }, []);

  // Native Acrylic owns the desktop diffusion. Keep the WebView tint light
  // enough that the stationary window still looks like glass, then use the
  // reading cards for contrast. Browser preview uses slightly denser values
  // because it does not have a real desktop backdrop underneath it.
  useEffect(() => {
    const root = document.documentElement;
    const transparency = clamp(settings.transparency, 40, 92) / 100;
    const intensity = clamp(settings.glassIntensity, 0, 100) / 100;

    const windowAlpha = desktopBridge.isTauri
      ? clamp(0.20 - transparency * 0.13, 0.07, 0.14)
      : clamp(0.30 - transparency * 0.18, 0.12, 0.22);
    const panelAlpha = desktopBridge.isTauri
      ? clamp(0.50 - transparency * 0.23, 0.26, 0.38)
      : clamp(0.62 - transparency * 0.28, 0.34, 0.50);
    const controlAlpha = desktopBridge.isTauri
      ? clamp(0.42 - transparency * 0.21, 0.20, 0.32)
      : clamp(0.50 - transparency * 0.22, 0.28, 0.42);
    const highlightAlpha = clamp(0.10 + intensity * 0.12, 0.10, 0.22);

    root.style.setProperty("--glass-window-alpha", windowAlpha.toFixed(3));
    root.style.setProperty("--glass-panel-alpha", panelAlpha.toFixed(3));
    root.style.setProperty("--glass-control-alpha", controlAlpha.toFixed(3));
    root.style.setProperty("--glass-highlight-alpha", highlightAlpha.toFixed(3));
    root.style.setProperty("--glass-blur", `${clamp(settings.blurAmount, 6, 20)}px`);
  }, [
    settings.transparency,
    settings.glassIntensity,
    settings.blurAmount,
  ]);

  useEffect(() => {
    speechService.configure(settings);
  }, [settings.speechProvider, settings.speechVoice, settings.speechRate]);

  const handleWindowPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!desktopBridge.isTauri || event.button !== 0 || !event.isPrimary) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(NON_DRAG_SELECTOR)) return;
    if (isScrollbarHit(target, event.clientX, event.clientY)) return;

    event.preventDefault();
    void desktopBridge.startDragging();
  };

  const nativeHostClass = desktopBridge.isTauri
    ? "relative z-40 w-full h-full flex items-stretch justify-stretch p-0"
    : "relative z-40 transition-all duration-300 ease-out flex items-center justify-center p-4";

  const nativeViewClass = desktopBridge.isTauri
    ? "w-full h-full"
    : "animate-in fade-in zoom-in-95 duration-200";

  return (
    <div
      className="lexi-app-root relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans antialiased text-slate-100"
      onPointerDownCapture={handleWindowPointerDownCapture}
    >
      {!desktopBridge.isTauri ? (
        <>
          <div className="absolute inset-0 lexi-preview-wallpaper" />
          <DesktopSimulator />
        </>
      ) : (
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
      )}

      <div className={nativeHostClass}>
        {windowMode === "bubble" && (
          <div className={desktopBridge.isTauri ? "w-full h-full flex items-center justify-center" : ""}>
            <FloatingBubble onExpand={() => store.restoreExpandedWindow()} />
          </div>
        )}

        {windowMode === "lookup" && (
          <div className={nativeViewClass}>
            <QuickLookup />
          </div>
        )}

        {windowMode === "study" && (
          <div className={nativeViewClass}>
            <FullStudyWindow />
          </div>
        )}
      </div>
    </div>
  );
}
