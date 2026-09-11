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

  const todayProgress = Math.min(
    100,
    Math.round((savedWords.length / Math.max(1, settings.dailyNewWordTarget)) * 100)
  );

  const sidebarItems: { id: StudyTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "notebook", label: "Sổ từ", icon: <BookOpen className="w-4 h-4 flex-shrink-0" />, badge: savedWords.length },
    { id: "flashcards", label: "Ôn tập", icon: <Brain className="w-4 h-4 flex-shrink-0" />, badge: dueCount > 0 ? dueCount : undefined },
    { id: "dashboard", label: "Tiến độ", icon: <BarChart3 className="w-4 h-4 flex-shrink-0" /> },
    { id: "settings", label: "Cài đặt", icon: <Settings className="w-4 h-4 flex-shrink-0" /> },
  ];

  return (
    <GlassSurface
      variant="window"
      className="w-[min(960px,calc(100vw-2rem))] h-[min(680px,calc(100vh-2rem))] min-w-0 min-h-[520px] flex flex-col select-text overflow-hidden"
    >
      <div className="h-11 px-4 border-b border-white/[0.07] flex items-center justify-between select-none flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-white/70 border border-white/25 flex-shrink-0" />
          <span className="text-sm font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">LexiGlass</span>
          <span className="text-[11px] text-slate-400 border-l border-white/[0.08] pl-2 truncate">Không gian học tập</span>
        </div>

        <div className="flex-1 h-full mx-4 cursor-move" title="Kéo để di chuyển cửa sổ" />

        <div className="flex items-center gap-1 flex-shrink-0">
          <GlassButton variant="icon" size="sm" tooltip="Về Tra từ nhanh" onClick={() => store.setWindowMode("lookup")}>
            <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
          </GlassButton>
          <GlassButton variant="icon" size="sm" tooltip={isPinned ? "Bỏ ghim trên cùng" : "Ghim luôn trên cùng"} active={isPinned} onClick={() => store.togglePin()}>
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-white rotate-45" : "text-slate-300"}`} />
          </GlassButton>
          <GlassButton variant="icon" size="sm" tooltip="Thu nhỏ thành bong bóng nổi (Esc)" onClick={() => store.setWindowMode("bubble")}>
            <X className="w-3.5 h-3.5 text-slate-300 hover:text-white" />
          </GlassButton>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside className="w-[180px] min-w-[160px] max-w-[196px] border-r border-white/[0.07] p-3 flex flex-col justify-between select-none flex-shrink-0 bg-white/[0.018]">
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const active = studyTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => store.setStudyTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                    active
                      ? "bg-white/[0.10] text-white border-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.045]"
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={active ? "text-[var(--accent)]" : "text-slate-500"}>{item.icon}</span>
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-1.5 flex-shrink-0 ${active ? "bg-white/[0.13] text-white" : "bg-white/[0.07] text-slate-400"}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-white/[0.07] space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.028] border border-white/[0.065] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Mục tiêu hôm nay</span>
                <span className="text-slate-200 font-medium">{savedWords.length}/{settings.dailyNewWordTarget}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div className="h-full bg-[var(--accent)] opacity-75 rounded-full transition-all duration-300" style={{ width: `${todayProgress}%` }} />
              </div>
            </div>

            {dueCount > 0 ? (
              <button
                type="button"
                onClick={() => store.setStudyTab("flashcards")}
                className="w-full py-1.5 px-2 rounded-lg bg-white/[0.055] hover:bg-white/[0.085] border border-white/[0.08] text-[11px] text-slate-300 font-medium flex items-center justify-between transition-colors"
              >
                <span>Cần ôn tập</span>
                <span className="px-1.5 rounded bg-white/[0.11] text-white font-semibold">{dueCount}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/75 px-2 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã ôn xong hôm nay</span>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto custom-scrollbar p-4 md:p-5">
          {studyTab === "notebook" && <VocabularyNotebook />}
          {studyTab === "flashcards" && <FlashcardReview />}
          {studyTab === "dashboard" && <StudyDashboard />}
          {studyTab === "settings" && <SettingsPanel />}
        </main>
      </div>
    </GlassSurface>
  );
};
