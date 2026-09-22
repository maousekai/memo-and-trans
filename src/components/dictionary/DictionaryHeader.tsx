import React, { useEffect, useMemo } from "react";
import { Pin, X, Settings, Layers } from "lucide-react";
import { GlassSearch } from "../glass/GlassSearch";
import { GlassButton } from "../glass/GlassButton";
import { store, useAppStore } from "../../store/useAppStore";
import { wordSuggestionService } from "../../services/search/wordSuggestionService";
import { localDictionaryService } from "../../services/dictionary/localDictionaryService";

export const DictionaryHeader: React.FC = () => {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const isLoading = useAppStore((s) => s.isLoading);
  const isPinned = useAppStore((s) => s.isPinned);
  const savedWords = useAppStore((s) => s.savedWords);
  const liquidGlassEnabled = useAppStore((s) => s.settings.liquidGlassEnabled);

  const suggestions = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || /\s/.test(trimmed)) return [];

    const merged = new Map<string, ReturnType<typeof wordSuggestionService.suggest>[number]>();
    wordSuggestionService.suggest(trimmed, savedWords, 5).forEach((item) => merged.set(item.word, item));
    localDictionaryService.suggestSpellings(trimmed, 5).forEach((item) => {
      const existing = merged.get(item.word);
      const suggestion = {
        word: item.word,
        score: item.score,
        source: "spelling" as const,
        reason: "edit-distance" as const,
        editDistance: item.distance,
      };
      if (!existing || suggestion.score > existing.score) merged.set(item.word, suggestion);
    });

    return [...merged.values()]
      .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
      .slice(0, 5);
  }, [searchQuery, savedWords]);

  useEffect(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length < 3 || trimmed.includes(" ")) return;

    const timer = window.setTimeout(() => {
      const best = suggestions[0];
      const likelyWord = best && best.score >= 0.82 ? best.word : trimmed;
      store.prefetchWord(likelyWord);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchQuery, suggestions]);

  const handleSearch = (value: string) => {
    store.submitQuery(value);
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
            tooltip={liquidGlassEnabled ? "Tắt Liquid Glass" : "Bật Liquid Glass"}
            active={liquidGlassEnabled}
            onClick={() => store.updateSettings({ liquidGlassEnabled: !liquidGlassEnabled })}
          >
            <Layers className={`w-3.5 h-3.5 ${liquidGlassEnabled ? "text-cyan-200" : "text-slate-400"}`} />
          </GlassButton>

          <GlassButton
            variant="icon"
            size="sm"
            tooltip="Cài đặt AI & ứng dụng"
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
        placeholder="Tra từ hoặc dịch cụm/câu tiếng Anh..."
      />
    </div>
  );
};
