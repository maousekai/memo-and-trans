import React from "react";
import { useAppStore, store, StudyTab } from "../../store/useAppStore";
import { GlassSurface } from "../glass/GlassSurface";
import { GlassButton } from "../glass/GlassButton";
import { VocabularyNotebook } from "../vocabulary/VocabularyNotebook";
import { FlashcardReview } from "../flashcards/FlashcardReview";
import { StudyDashboard } from "./StudyDashboard";
import { SettingsPanel } from "../settings/SettingsPanel";
import { BookOpen, Brain, BarChart3, Settings, Minimize2, Pin, X, CheckCircle2 } from "lucide-react";

export const FullStudyWindow: React.FC = () => {
  const studyTab = useAppStore((s) => s.studyTab);
  const isPinned = useAppStore((s) => s.isPinned);
  const savedWords = useAppStore((s) => s.savedWords);
  const settings = useAppStore((s) => s.settings);

  const dueCount = savedWords.filter(
    (w) => !w.isKnown && new Date(w.fsrs.due).getTime() <= Date.now()
  ).length;

  const masteredCount = savedWords.filter((w) => w.mastery >= 80).length;
  const todayProgress = Math.min(
    100,
    Math.round((savedWords.length / Math.max(1, settings.dailyNewWordTarget)) * 100)
  );

  const sidebarItems: { id: StudyTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "notebook",
      label: "Sổ từ",
      icon: <BookOpen className="w-4 h-4 flex-shrink-0" />,
      badge: savedWords.length,
    },
    {
      id: "flashcards",
      label: "Ôn tập",
      icon: <Brain className="w-4 h-4 flex-shrink-0" />,
      badge: dueCount > 0 ? dueCount : undefined,
    },
    {
      id: "dashboard",
      label: "Tiến độ",
      icon: <BarChart3 className="w-4 h-4 flex-shrink-0" />,
    },
    {
      id: "settings",
      label: "Cài đặt",
      icon: <Settings className="w-4 h-4 flex-shrink-0" />,
    },
  ];

  return (
    <GlassSurface
      variant="window"
      glow
      className="w-full max-w-[880px] h-[640px] flex flex-col select-text shadow-2xl overflow-hidden"
    >
      {/* 1. Custom Title Bar (Height 44px) - Separated from navigation */}
      <div className="h-11 px-4 border-b border-white/[0.08] flex items-center justify-between select-none flex-shrink-0">
        {/* Left: Window Brand */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="text-sm font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            LexiGlass
          </span>
          <span className="text-[11px] text-slate-400 border-l border-white/10 pl-2">
            Không gian học tập
          </span>
        </div>

        {/* Center: Draggable Window Region */}
        <div className="flex-1 h-full mx-4 cursor-move" title="Kéo để di chuyển cửa sổ" />

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1">
          {/* Minimize to Quick Lookup */}
          <GlassButton
            variant="icon"
            size="sm"
            tooltip="Thu nhỏ về Tra từ nhanh (Quick Lookup)"
            onClick={() => store.setWindowMode("lookup")}
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
          </GlassButton>

          {/* Always on top Pin */}
          <GlassButton
            variant="icon"
            size="sm"
            tooltip={isPinned ? "Bỏ ghim trên cùng" : "Ghim luôn trên cùng"}
            active={isPinned}
            onClick={() => store.togglePin()}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-cyan-300 rotate-45" : "text-slate-300"}`} />
          </GlassButton>

          {/* Close to Bubble */}
          <GlassButton
            variant="icon"
            size="sm"
            tooltip="Thu nhỏ thành bong bóng nổi (Esc)"
            onClick={() => store.setWindowMode("bubble")}
          >
            <X className="w-3.5 h-3.5 text-slate-300 hover:text-white" />
          </GlassButton>
        </div>
      </div>

      {/* 2. Main Window Body: Left Sidebar (180px) + Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-[180px] min-w-[56px] max-w-[196px] border-r border-white/[0.08] p-3 flex flex-col justify-between select-none flex-shrink-0 bg-black/10">
          {/* Top navigation links */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const active = studyTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => store.setStudyTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.icon}
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1.5 flex-shrink-0 ${
                        active
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Widget: Daily Goal & Due Reviews */}
          <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Mục tiêu hôm nay</span>
                <span className="text-cyan-300 font-medium">{savedWords.length}/{settings.dailyNewWordTarget}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${todayProgress}%` }}
                />
              </div>
            </div>

            {dueCount > 0 ? (
              <button
                type="button"
                onClick={() => store.setStudyTab("flashcards")}
                className="w-full py-1.5 px-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/25 text-[11px] text-cyan-200 font-medium flex items-center justify-between transition-colors"
              >
                <span>Cần ôn tập:</span>
                <span className="px-1.5 rounded bg-cyan-400 text-slate-950 font-bold">{dueCount} từ</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80 px-2 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã ôn xong hôm nay</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 md:p-5">
          {studyTab === "notebook" && <VocabularyNotebook />}
          {studyTab === "flashcards" && <FlashcardReview />}
          {studyTab === "dashboard" && <StudyDashboard />}
          {studyTab === "settings" && <SettingsPanel />}
        </main>
      </div>
    </GlassSurface>
  );
};
