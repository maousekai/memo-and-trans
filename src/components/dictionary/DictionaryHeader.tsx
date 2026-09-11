import React, { useMemo } from "react";
import { Pin, X, Settings } from "lucide-react";
import { GlassSearch } from "../glass/GlassSearch";
import { GlassButton } from "../glass/GlassButton";
import { store, useAppStore } from "../../store/useAppStore";
import { wordSuggestionService } from "../../services/search/wordSuggestionService";
import { desktopBridge } from "../../services/desktop/desktopBridge";

export const DictionaryHeader: React.FC = () => {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const isLoading = useAppStore((s) => s.isLoading);
  const isPinned = useAppStore((s) => s.isPinned);
  const savedWords = useAppStore((s) => s.savedWords);

  const suggestions = useMemo(
    () => wordSuggestionService.suggest(searchQuery, savedWords, 5),
    [searchQuery, savedWords],
  );

  const handleSearch = (word: string) => {
    store.searchWord(word);
  };

  const openSettings = async () => {
    store.setStudyTab("settings");
    await store.setWindowMode("study");
  };

  return (
    <div className="relative z-30 flex flex-col gap-2.5 pb-2.5 border-b border-white/[0.07]">
      <div
        className="flex items-center justify-between text-xs min-h-8 cursor-move"
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("button,input")) return;
          desktopBridge.startDragging();
        }}
        title="Giữ và kéo để di chuyển LexiGlass"
      >
        <div className="flex items-center gap-2 select-none pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-white/70 border border-white/25" />
          <span className="text-sm font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            LexiGlass
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Kéo để di chuyển</span>
        </div>

        <div className="flex items-center gap-1 cursor-default">
          <GlassButton
            variant="icon"
            size="sm"
            tooltip="Cài đặt & NVIDIA API"
            onClick={openSettings}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
          </GlassButton>

          <GlassButton
            variant="icon"
            size="sm"
            tooltip={isPinned ? "Bỏ ghim trên cùng" : "Ghim luôn trên cùng"}
            active={isPinned}
            onClick={() => store.togglePin()}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-slate-100 rotate-45" : "text-slate-400"}`} />
          </GlassButton>

          <GlassButton
            variant="icon"
            size="sm"
            tooltip="Thu nhỏ thành bong bóng nổi (Esc)"
            onClick={() => store.setWindowMode("bubble")}
          >
            <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
          </GlassButton>
        </div>
      </div>

      <GlassSearch
        value={searchQuery}
        onChange={(value) => store.setSearchQuery(value)}
        onSearch={handleSearch}
        suggestions={suggestions}
        isLoading={isLoading}
        placeholder="Tra từ tiếng Anh..."
      />
    </div>
  );
};
