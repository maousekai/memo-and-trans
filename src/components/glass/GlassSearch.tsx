import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, CornerDownLeft } from "lucide-react";

interface GlassSearchProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export const GlassSearch: React.FC<GlassSearchProps> = ({
  value,
  onChange,
  onSearch,
  isLoading = false,
  autoFocus = true,
  placeholder = "Search English word or idiom...",
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch(localVal);
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setLocalVal("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={`
        relative flex items-center w-full
        bg-[rgba(42,50,58,0.28)] hover:bg-[rgba(50,60,70,0.35)] focus-within:bg-[rgba(50,60,70,0.42)]
        border border-white/[0.10] focus-within:border-[rgba(88,204,255,0.45)] focus-within:ring-1 focus-within:ring-[rgba(88,204,255,0.20)]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_4px_16px_rgba(0,0,0,0.25)]
        rounded-[16px] transition-all duration-200
        ${className}
      `}
    >
      <div className="pl-3.5 pr-2 text-slate-400">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[rgba(88,204,255,0.85)]" />
        ) : (
          <Search className="w-4 h-4 text-slate-400" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        spellCheck={false}
        value={localVal}
        onChange={(e) => {
          setLocalVal(e.target.value);
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 pr-14 text-sm text-[rgba(245,248,252,0.96)] placeholder-slate-400/80 outline-none"
      />

      <div className="absolute right-2.5 flex items-center gap-1">
        {localVal && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onSearch(localVal)}
          title="Press Enter to search"
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
        >
          <CornerDownLeft className="w-2.5 h-2.5" />
          <span>↵</span>
        </button>
      </div>
    </div>
  );
};
