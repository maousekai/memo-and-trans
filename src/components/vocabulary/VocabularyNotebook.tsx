import React, { useState, useMemo } from "react";
import { useAppStore, store } from "../../store/useAppStore";
import { SavedWord } from "../../types/study";
import { GlassSurface } from "../glass/GlassSurface";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { Search, Star, CheckCircle, RotateCcw, Trash2, Edit3, Volume2, Calendar, Tag, ExternalLink } from "lucide-react";
import { speechService } from "../../services/pronunciation/speechService";

export const VocabularyNotebook: React.FC = () => {
  const savedWords = useAppStore((s) => s.savedWords);
  const settings = useAppStore((s) => s.settings);

  // Filters and sorting
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedPos, setSelectedPos] = useState<string>("all");
  const [selectedCefr, setSelectedCefr] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "alphabetical" | "due">("newest");
  const [editingWord, setEditingWord] = useState<SavedWord | null>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    savedWords.forEach((w) => w.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [savedWords]);

  // Filtered and sorted words
  const filteredWords = useMemo(() => {
    return savedWords
      .filter((w) => {
        // text search
        if (search) {
          const q = search.toLowerCase();
          const matchWord = w.word.toLowerCase().includes(q);
          const matchMeaning = w.dictionary.partsOfSpeech.some((p) =>
            p.meanings.some((m) => m.vietnamese.toLowerCase().includes(q))
          );
          if (!matchWord && !matchMeaning) return false;
        }
        // tag filter
        if (selectedTag !== "all" && !w.tags.includes(selectedTag)) return false;
        // pos filter
        if (
          selectedPos !== "all" &&
          !w.dictionary.partsOfSpeech.some((p) => p.type.toLowerCase() === selectedPos.toLowerCase())
        )
          return false;
        // cefr filter
        if (selectedCefr !== "all" && w.dictionary.cefr !== selectedCefr) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "alphabetical") return a.word.localeCompare(b.word);
        if (sortBy === "due") return new Date(a.fsrs.due).getTime() - new Date(b.fsrs.due).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [savedWords, search, selectedTag, selectedPos, selectedCefr, sortBy]);

  const handleOpenWordInDictionary = (w: SavedWord) => {
    store.searchWord(w.word);
    store.setWindowMode("lookup");
  };

  const handleSaveNotes = (id: string, notes: string, tagsStr: string) => {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    store.updateSavedWord(id, { notes, tags });
    setEditingWord(null);
  };

  return (
    <div className="flex flex-col h-full space-y-3 select-text">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo từ hoặc nghĩa tiếng Việt..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-slate-100 placeholder-slate-400 outline-none focus:border-cyan-400/50"
          />
        </div>

        {/* Tag Filter */}
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 outline-none"
        >
          <option value="all">Tất cả Tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>

        {/* CEFR Filter */}
        <select
          value={selectedCefr}
          onChange={(e) => setSelectedCefr(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 outline-none"
        >
          <option value="all">Tất cả CEFR</option>
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((c) => (
            <option key={c} value={c}>
              CEFR {c}
            </option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 outline-none"
        >
          <option value="newest">Mới thêm gần đây</option>
          <option value="alphabetical">A → Z</option>
          <option value="due">Hạn ôn tập gần nhất</option>
        </select>
      </div>

      {/* Vocabulary List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredWords.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            <p>Không tìm thấy từ vựng phù hợp với bộ lọc.</p>
            <GlassButton
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearch("");
                setSelectedTag("all");
                setSelectedPos("all");
                setSelectedCefr("all");
              }}
            >
              Đặt lại bộ lọc
            </GlassButton>
          </div>
        ) : (
          filteredWords.map((w) => {
            const primaryPos = w.dictionary.partsOfSpeech[0];
            const primaryMeaning = primaryPos?.meanings[0]?.vietnamese || "Không có nghĩa";
            const isDue = new Date(w.fsrs.due).getTime() <= Date.now() && !w.isKnown;

            return (
              <GlassSurface
                key={w.id}
                variant="card"
                className="p-3 flex items-center justify-between gap-3 group"
              >
                {/* Left: Word, IPA, POS, Meaning */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenWordInDictionary(w)}
                      className="text-base font-bold text-slate-100 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                    >
                      <span>{w.word}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <span className="font-mono text-xs text-slate-400">
                      {w.dictionary.ipaUS || w.dictionary.ipaUK}
                    </span>

                    <button
                      type="button"
                      onClick={() => speechService.speak(w.word, settings.pronunciationAccent)}
                      title="Nghe phát âm"
                      className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {primaryPos && <GlassBadge variant="pos">{primaryPos.type}</GlassBadge>}
                    {w.dictionary.cefr && (
                      <GlassBadge variant="cefr" cefrLevel={w.dictionary.cefr}>
                        {w.dictionary.cefr}
                      </GlassBadge>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-[10px] text-cyan-300 font-medium">
                      Stage {w.learningStage ?? 0}
                    </span>
                  </div>

                  {/* Vietnamese Meaning */}
                  <p className="text-xs text-slate-200 mt-1 truncate">
                    {primaryMeaning}
                  </p>

                  {/* Tags and Notes Preview */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                    {w.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/10 text-slate-400"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{tag}</span>
                      </span>
                    ))}
                    {w.notes && (
                      <span className="italic text-slate-400 truncate max-w-[240px]">
                        "{w.notes}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Mastery indicator, Due date, Actions */}
                <div className="flex items-center gap-3">
                  {/* Mastery score ring */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400">Độ nhớ</span>
                    <span
                      className={`text-xs font-bold ${
                        w.mastery >= 80
                          ? "text-emerald-300"
                          : w.mastery >= 50
                          ? "text-sky-300"
                          : "text-amber-300"
                      }`}
                    >
                      {w.mastery}%
                    </span>
                  </div>

                  {/* Due status */}
                  <div className="flex flex-col items-end text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{isDue ? "Cần ôn ngay" : "Hạn ôn"}</span>
                    </span>
                    <span
                      className={
                        isDue ? "text-rose-400 font-semibold" : "text-slate-300"
                      }
                    >
                      {new Date(w.fsrs.due).toLocaleDateString(undefined, {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Favorite Toggle */}
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      tooltip={w.favorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                      onClick={() => store.toggleFavorite(w.id)}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          w.favorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-400"
                        }`}
                      />
                    </GlassButton>

                    {/* Mark Known */}
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      tooltip={w.isKnown ? "Đã thuộc (Click để bỏ)" : "Đánh dấu đã thuộc"}
                      onClick={() => store.toggleKnown(w.id)}
                    >
                      <CheckCircle
                        className={`w-3.5 h-3.5 ${
                          w.isKnown ? "text-emerald-400" : "text-slate-400"
                        }`}
                      />
                    </GlassButton>

                    {/* Edit Notes / Tags */}
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      tooltip="Chỉnh sửa ghi chú & thẻ"
                      onClick={() => setEditingWord(w)}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    </GlassButton>

                    {/* Reset Progress */}
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      tooltip="Đặt lại tiến độ FSRS"
                      onClick={() => store.resetProgress(w.id)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    </GlassButton>

                    {/* Delete Word */}
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      tooltip="Xóa từ khỏi sổ tay"
                      onClick={() => store.deleteSavedWord(w.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400/80 hover:text-rose-400" />
                    </GlassButton>
                  </div>
                </div>
              </GlassSurface>
            );
          })
        )}
      </div>

      {/* Edit Notes & Tags Modal */}
      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassSurface variant="window" className="w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>Chỉnh sửa: {editingWord.word}</span>
            </h3>

            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-medium">Ghi chú cá nhân:</label>
              <textarea
                id="edit-notes-input"
                defaultValue={editingWord.notes}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-100 outline-none focus:border-cyan-400/50"
                placeholder="Ví dụ: Cần chú ý dùng với giới từ 'against'..."
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-medium">Tags (phân cách bằng dấu phẩy):</label>
              <input
                id="edit-tags-input"
                type="text"
                defaultValue={editingWord.tags.join(", ")}
                className="w-full p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-100 outline-none focus:border-cyan-400/50"
                placeholder="IELTS, Academic, Business"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="secondary" onClick={() => setEditingWord(null)}>
                Hủy
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={() => {
                  const notes = (document.getElementById("edit-notes-input") as HTMLTextAreaElement)?.value || "";
                  const tagsStr = (document.getElementById("edit-tags-input") as HTMLInputElement)?.value || "";
                  handleSaveNotes(editingWord.id, notes, tagsStr);
                }}
              >
                Lưu thay đổi
              </GlassButton>
            </div>
          </GlassSurface>
        </div>
      )}
    </div>
  );
};
