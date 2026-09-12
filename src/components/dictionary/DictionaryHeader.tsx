import React, { useMemo } from "react";
import { Pin, X, Settings } from "lucide-react";
import { GlassSearch } from "../glass/GlassSearch";
import { GlassButton } from "../glass/GlassButton";
import { store, useAppStore } from "../../store/useAppStore";
import { wordSuggestionService } from "../../services/search/wordSuggestionService";

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
    <div className="relative z-30 flex flex-col gap-2.5 pb-2.5 border-b border-white/[0.075]">
      <div className="flex items-center justify-between text-xs min-h-8 select-none">
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-white/70 border border-white/25" />
          <span className="text-sm font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            LexiGlass
          </span>
        </div>

        <div className="flex items-center gap-1">
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
