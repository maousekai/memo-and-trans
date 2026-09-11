import React, { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, CornerDownLeft, History, Bookmark } from "lucide-react";
import type { WordSuggestion } from "../../services/search/wordSuggestionService";
import { wordSuggestionService } from "../../services/search/wordSuggestionService";

interface GlassSearchProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
  suggestions?: WordSuggestion[];
  isLoading?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export const GlassSearch: React.FC<GlassSearchProps> = ({
  value,
  onChange,
  onSearch,
  suggestions = [],
  isLoading = false,
  autoFocus = true,
  placeholder = "Search English word or idiom...",
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localVal, setLocalVal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => setLocalVal(value), [value]);
  useEffect(() => setActiveIndex(-1), [localVal, suggestions.length]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const visibleSuggestions = suggestions
    .filter((item) => item.word.toLowerCase() !== localVal.trim().toLowerCase())
    .slice(0, 5);
  const showSuggestions = isFocused && localVal.trim().length >= 2 && visibleSuggestions.length > 0 && !isLoading;

  const chooseSuggestion = (suggestion: WordSuggestion, searchImmediately = true) => {
    setLocalVal(suggestion.word);
    onChange(suggestion.word);
    setActiveIndex(-1);
    if (searchImmediately) {
      setIsFocused(false);
      onSearch(suggestion.word);
    }
  };

  const submit = () => {
    const best = visibleSuggestions[0];
    if (wordSuggestionService.shouldAutoPreferSuggestion(localVal, best)) {
      chooseSuggestion(best, true);
      return;
    }
    setIsFocused(false);
    onSearch(localVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visibleSuggestions.length - 1));
      return;
    }
    if (showSuggestions && e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (e.key === "Tab" && showSuggestions && visibleSuggestions.length > 0) {
      e.preventDefault();
      chooseSuggestion(visibleSuggestions[Math.max(0, activeIndex)], false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && activeIndex >= 0) {
        chooseSuggestion(visibleSuggestions[activeIndex], true);
      } else {
        submit();
      }
      return;
    }
    if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setLocalVal("");
    onChange("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full z-40 ${className}`}>
      <div className="relative flex items-center w-full bg-white/[0.075] hover:bg-white/[0.095] focus-within:bg-white/[0.115] border border-white/[0.10] focus-within:border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_5px_18px_rgba(0,0,0,0.14)] rounded-[16px] transition-all duration-200">
        <div className="pl-3.5 pr-2 text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={localVal}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          onChange={(e) => {
            setLocalVal(e.target.value);
            onChange(e.target.value);
            setIsFocused(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 pr-14 text-sm text-[var(--text-primary)] placeholder-slate-400/75 outline-none"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {localVal && !isLoading && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleClear} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Xóa">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={submit} title="Tra từ (Enter)" className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.055] hover:bg-white/[0.10] text-[10px] text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-colors">
            <CornerDownLeft className="w-2.5 h-2.5" />
            <span>↵</span>
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="lexi-suggestion-popover absolute left-0 right-0 top-[calc(100%+7px)] rounded-[15px] p-1.5 z-50 overflow-hidden">
          <div className="px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-400/80">
            Gợi ý từ
          </div>
          {visibleSuggestions.map((suggestion, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${suggestion.word}-${suggestion.source}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseSuggestion(suggestion, true)}
                className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[10px] text-left transition-colors ${selected ? "bg-white/[0.11]" : "hover:bg-white/[0.065]"}`}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-[13px] font-semibold text-slate-100 truncate">{suggestion.word}</span>
                    {suggestion.partOfSpeech && <span className="text-[10px] text-slate-500 italic truncate">{suggestion.partOfSpeech}</span>}
                  </div>
                  {suggestion.vietnameseMeaning && <div className="text-[10px] text-slate-400 truncate mt-0.5">{suggestion.vietnameseMeaning}</div>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] text-slate-500">
                  {suggestion.source === "history" && <History className="w-3 h-3" />}
                  {suggestion.source === "vocabulary" && <Bookmark className="w-3 h-3" />}
                  {suggestion.reason === "common-typo" || suggestion.reason === "transposition" || suggestion.reason === "keyboard-neighbor" || suggestion.reason === "edit-distance" ? <span>Sửa chính tả</span> : null}
                </div>
              </button>
            );
          })}
          <div className="px-2.5 pt-1.5 pb-1 text-[9px] text-slate-500 border-t border-white/[0.06] mt-1">
            ↑↓ chọn · Tab hoàn tất · Enter tra
          </div>
        </div>
      )}
    </div>
  );
};
