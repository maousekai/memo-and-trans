import React, { useMemo, useState } from "react";
import { BookmarkCheck, Calendar, Search, Trash2, Volume2 } from "lucide-react";
import { useAppStore, store } from "../../store/useAppStore";
import { speechService } from "../../services/pronunciation/speechService";
import { GlassSurface } from "../glass/GlassSurface";

export const SavedPhraseNotebook: React.FC = () => {
  const savedPhrases = useAppStore((s) => s.savedPhrases);
  const settings = useAppStore((s) => s.settings);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return savedPhrases;
    return savedPhrases.filter((phrase) =>
      phrase.sourceText.toLowerCase().includes(query) ||
      phrase.translation.toLowerCase().includes(query)
    );
  }, [savedPhrases, search]);

  if (savedPhrases.length === 0) return null;

  return (
    <GlassSurface variant="card" className="p-3 space-y-2.5 flex-shrink-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <BookmarkCheck className="w-4 h-4 text-cyan-200" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white">Cụm & câu đã lưu</h3>
            <p className="text-[10px] text-slate-400">{savedPhrases.length} mục · tham gia ôn tập FSRS cùng từ vựng</p>
          </div>
        </div>
        <div className="relative w-[220px] max-w-full">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm cụm/câu..."
            className="w-full h-8 pl-8 pr-2 rounded-lg bg-white/[0.05] border border-white/[0.09] text-[11px] text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>
      </div>

      <div className="max-h-[170px] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
        {visible.map((phrase) => {
          const due = new Date(phrase.fsrs.due).getTime() <= Date.now() && !phrase.isKnown;
          return (
            <div key={phrase.id} className="rounded-xl border border-white/[0.075] bg-slate-950/25 px-3 py-2 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-100 truncate">{phrase.sourceText}</p>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">{phrase.translation}</p>
                <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
                  <span>Stage {phrase.learningStage}</span>
                  <span>Độ nhớ {phrase.mastery}%</span>
                  <span className={due ? "text-rose-300" : ""}>
                    <Calendar className="inline w-2.5 h-2.5 mr-0.5" />
                    {due ? "cần ôn" : new Date(phrase.fsrs.due).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => speechService.speak(phrase.sourceText, settings.pronunciationAccent)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-200 hover:bg-white/[0.06]"
                title="Nghe cụm/câu"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => store.deleteSavedPhrase(phrase.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-300/[0.06]"
                title="Xóa cụm/câu"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-4">Không có cụm/câu khớp tìm kiếm.</p>
        )}
      </div>
    </GlassSurface>
  );
};
