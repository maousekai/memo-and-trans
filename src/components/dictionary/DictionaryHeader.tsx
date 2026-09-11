import React from "react";
import { Pin, X } from "lucide-react";
import { GlassSearch } from "../glass/GlassSearch";
import { GlassButton } from "../glass/GlassButton";
import { store, useAppStore } from "../../store/useAppStore";

export const DictionaryHeader: React.FC = () => {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const isLoading = useAppStore((s) => s.isLoading);
  const isPinned = useAppStore((s) => s.isPinned);

  const handleSearch = (word: string) => {
    store.searchWord(word);
  };

  return (
    <div className="flex flex-col gap-2.5 pb-2.5 border-b border-white/[0.08]">
      {/* Top window controls row: clean, uncrowded */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 select-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="text-sm font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            LexiGlass
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Always-on-top Pin */}
          <GlassButton
            variant="icon"
            size="sm"
            tooltip={isPinned ? "Bỏ ghim trên cùng" : "Ghim luôn trên cùng"}
            active={isPinned}
            onClick={() => store.togglePin()}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-cyan-300 rotate-45" : "text-slate-400"}`} />
          </GlassButton>

          {/* Close / Minimize to Bubble */}
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

      {/* Dedicated full-width search input */}
      <div className="w-full">
        <GlassSearch
          value={searchQuery}
          onChange={(v) => store.setSearchQuery(v)}
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Tra từ tiếng Anh (vd: mitigate, subtle)..."
        />
      </div>
    </div>
  );
};
