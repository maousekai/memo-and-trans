import React, { useState } from "react";
import { store, useAppStore } from "../../store/useAppStore";
import { Sparkles, Command, FileText, Code2, Globe, Monitor, RefreshCw } from "lucide-react";

export const DesktopSimulator: React.FC = () => {
  const windowMode = useAppStore((s) => s.windowMode);
  const settings = useAppStore((s) => s.settings);
  const [activeDoc, setActiveDoc] = useState<"article" | "code">("article");

  // Allow user to highlight sample words in the background document
  const handleSelectWord = (word: string) => {
    store.setSimulatedClipboard(word);
    store.searchWord(word);
    if (windowMode === "bubble") {
      store.setWindowMode("lookup");
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-4">
      {/* Top simulated desktop bar */}
      <div className="pointer-events-auto flex items-center justify-between text-xs text-slate-400/80 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 w-full max-w-4xl mx-auto shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>Không gian làm việc</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400/70 border-l border-white/10 pl-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
            <span>Mặt kính trong suốt (Preview Glass)</span>
          </div>
        </div>

        {/* Selected text workflow trigger */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Chọn từ và nhấn:
          </span>
          <button
            type="button"
            onClick={() => store.captureSelectedAndLookup()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-400/25 font-medium text-xs shadow-sm transition-all"
            title="Thử nghiệm tra từ nhanh bằng phím tắt"
          >
            <Command className="w-3.5 h-3.5" />
            <span>{settings.globalShortcut}</span>
          </button>
        </div>
      </div>

      {/* Simulated background reader window (mimicking Chrome / VS Code / PDF Reader) */}
      <div className="pointer-events-auto my-auto w-full max-w-3xl mx-auto rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden text-xs text-slate-300">
        {/* Mock window titlebar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-1 ml-2 text-[11px] text-slate-400">
              {activeDoc === "article" ? (
                <>
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nature_Review_Article.pdf (PDF Reader)</span>
                </>
              ) : (
                <>
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>lexiglass_core.rs (VS Code)</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveDoc("article")}
              className={`px-2 py-0.5 rounded text-[11px] ${
                activeDoc === "article" ? "bg-white/10 text-white" : "text-slate-400"
              }`}
            >
              Document
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc("code")}
              className={`px-2 py-0.5 rounded text-[11px] ${
                activeDoc === "code" ? "bg-white/10 text-white" : "text-slate-400"
              }`}
            >
              Code
            </button>
          </div>
        </div>

        {/* Mock Document Content with selectable words */}
        <div className="p-5 leading-relaxed space-y-3 select-text font-serif text-[13px] text-slate-300">
          {activeDoc === "article" ? (
            <>
              <p>
                In recent climate resilience assessments, international researchers emphasized the need to{" "}
                <span
                  onClick={() => handleSelectWord("mitigate")}
                  className="px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-200 cursor-pointer border border-cyan-400/30 hover:bg-cyan-500/40"
                  title="Click to lookup 'mitigate'"
                >
                  mitigate
                </span>{" "}
                potential hazards through proactive ecological interventions. Even{" "}
                <span
                  onClick={() => handleSelectWord("subtle")}
                  className="px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-200 cursor-pointer border border-cyan-400/30 hover:bg-cyan-500/40"
                  title="Click to lookup 'subtle'"
                >
                  subtle
                </span>{" "}
                shifts in temperature can trigger widespread consequences across agricultural zones.
              </p>
              <p>
                A{" "}
                <span
                  onClick={() => handleSelectWord("comprehensive")}
                  className="px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-200 cursor-pointer border border-cyan-400/30 hover:bg-cyan-500/40"
                  title="Click to lookup 'comprehensive'"
                >
                  comprehensive
                </span>{" "}
                framework is essential to{" "}
                <span
                  onClick={() => handleSelectWord("retain")}
                  className="px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-200 cursor-pointer border border-cyan-400/30 hover:bg-cyan-500/40"
                  title="Click to lookup 'retain'"
                >
                  retain
                </span>{" "}
                biodiversity without imposing{" "}
                <span
                  onClick={() => handleSelectWord("ambiguous")}
                  className="px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-200 cursor-pointer border border-cyan-400/30 hover:bg-cyan-500/40"
                  title="Click to lookup 'ambiguous'"
                >
                  ambiguous
                </span>{" "}
                statutory standards upon local communities.
              </p>
              <p className="text-[11px] font-sans text-slate-400 italic">
                Tip: Nhấp vào bất kỳ từ được gạch chân màu xanh ở trên, hoặc bôi đen văn bản và bấm{" "}
                <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-cyan-300">
                  {settings.globalShortcut}
                </kbd>{" "}
                để kiểm tra quy trình tra cứu nổi tức thì!
              </p>
            </>
          ) : (
            <div className="font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500">// Rust Tauri 2 native desktop companion core</p>
              <p>
                <span className="text-purple-400">pub fn</span>{" "}
                <span className="text-cyan-300">capture_selected_text</span>() -&gt; Option&lt;String&gt; &#123;
              </p>
              <p className="pl-4">
                <span className="text-slate-400">// Native Windows clipboard & selection hook</span>
              </p>
              <p className="pl-4">
                <span className="text-purple-400">let</span> query = <span className="text-emerald-300">"mitigate"</span>;
              </p>
              <p className="pl-4">
                windows_acrylic::apply_blur(&window, Intensity::High);
              </p>
              <p>&#125;</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar simulating desktop taskbar */}
      <div className="pointer-events-auto flex items-center justify-between text-[11px] text-slate-400/80 px-4 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 w-full max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>LexiGlass Desktop Overlay</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => store.setWindowMode("bubble")}
            className={`hover:text-cyan-300 ${windowMode === "bubble" ? "text-cyan-300 font-bold" : ""}`}
          >
            Bubble
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => store.setWindowMode("lookup")}
            className={`hover:text-cyan-300 ${windowMode === "lookup" ? "text-cyan-300 font-bold" : ""}`}
          >
            Lookup
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => store.setWindowMode("study")}
            className={`hover:text-cyan-300 ${windowMode === "study" ? "text-cyan-300 font-bold" : ""}`}
          >
            Study Hub
          </button>
        </div>
      </div>
    </div>
  );
};
