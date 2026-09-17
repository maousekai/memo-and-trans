import React, { useEffect, useState } from "react";
import { DictionaryHeader } from "./DictionaryHeader";
import { MeaningCard } from "./MeaningCard";
import { ExpandableSection, WordFamilyList, CommonMistakesList } from "./ExpandableSection";
import { TranslationView } from "../translation/TranslationView";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassSurface } from "../glass/GlassSurface";
import { useAppStore, store } from "../../store/useAppStore";
import { Volume2, Sparkles, AlertCircle, Copy, Check, Bookmark, BookmarkCheck, ArrowRight, Languages } from "lucide-react";
import { speechService } from "../../services/pronunciation/speechService";

export const QuickLookup: React.FC = () => {
  const currentEntry = useAppStore((s) => s.currentEntry);
  const currentTranslation = useAppStore((s) => s.currentTranslation);
  const queryMode = useAppStore((s) => s.queryMode);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.error);
  const isDemoEntry = useAppStore((s) => s.isDemoEntry);
  const settings = useAppStore((s) => s.settings);
  const isDictionaryMode = queryMode === "dictionary";
  const isSaved = isDictionaryMode ? store.isCurrentWordSaved() : false;

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") store.setWindowMode("bubble");
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (isDictionaryMode) handleToggleSave();
        else if (currentTranslation) {
          store.saveCurrentPhrase();
          showToast("Đã lưu cụm/câu");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentEntry, currentTranslation, isSaved, isDictionaryMode]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleSave = () => {
    if (!currentEntry) return;
    if (isSaved) {
      const savedWord = store.getState().savedWords.find(
        (w) => w.normalizedWord === currentEntry.normalizedWord.toLowerCase()
      );
      if (savedWord) {
        store.deleteSavedWord(savedWord.id);
        showToast("Đã xóa khỏi Sổ từ");
      }
    } else {
      store.saveCurrentWord();
      showToast("Đã lưu vào Sổ từ");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1800);
  };

  return (
    <GlassSurface
      variant="window"
      glow
      className="w-[400px] max-w-[460px] min-w-[360px] max-h-[620px] flex flex-col p-4 select-text transition-all duration-200 relative"
    >
      <DictionaryHeader />

      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/40 text-cyan-200 text-xs font-medium shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-3.5 h-3.5 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="overflow-y-auto pr-1 mt-2.5 space-y-2.5 custom-scrollbar flex-1">
        {isLoading && (
          <div className="py-4 px-1 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-7 w-36 rounded-lg bg-white/10" />
              <div className="h-6 w-16 rounded-lg bg-white/5" />
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] space-y-2">
              <div className="h-4 w-40 rounded bg-white/10" />
              <div className="h-3.5 w-full rounded bg-white/5" />
              <div className="h-3.5 w-3/4 rounded bg-white/5" />
            </div>
            <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5">
              {!isDictionaryMode && <Languages className="w-3.5 h-3.5 text-cyan-300" />}
              {isDictionaryMode ? "Đang tra từ điển…" : "Đang dịch Anh → Việt…"}
            </p>
          </div>
        )}

        {error && !isLoading && (
          <GlassSurface variant="inset" className="p-3 border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2 my-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{isDictionaryMode ? "Không tìm thấy từ hoặc dịch vụ gián đoạn" : "Không thể dịch văn bản"}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{error}</p>
            {isDictionaryMode && (
              <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">Thử từ mẫu:</span>
                {["occupation", "company", "mitigate", "subtle", "retain"].map((demoWord) => (
                  <button
                    key={demoWord}
                    type="button"
                    onClick={() => store.submitQuery(demoWord)}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-cyan-500/20 text-cyan-200 text-[11px] border border-white/10 transition-colors"
                  >
                    {demoWord}
                  </button>
                ))}
              </div>
            )}
          </GlassSurface>
        )}

        {!isLoading && !error && !currentEntry && !currentTranslation && (
          <div className="py-4 px-2 text-center flex flex-col items-center gap-2">
            <p className="text-xs text-slate-300">
              Nhập một từ để tra, hoặc nhập/bôi đen cụm từ, câu hay đoạn tiếng Anh để dịch.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap justify-center pt-1">
              {["occupation", "For many of them,", "according to", "The shipment has been delayed."].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => store.submitQuery(sample)}
                  className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-cyan-500/20 text-cyan-300 text-xs border border-white/10 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && !isDictionaryMode && currentTranslation && <TranslationView />}

        {!isLoading && !error && isDictionaryMode && currentEntry && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {isDemoEntry && (
              <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Dữ liệu từ điển chuẩn hóa</span>
                </span>
                <span className="text-[10px] text-slate-400">Offline / Cache</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">{currentEntry.query}</h1>
                  {currentEntry.syllables && <span className="text-xs text-slate-400 font-mono">· {currentEntry.syllables}</span>}
                  {currentEntry.cefr && <GlassBadge variant="cefr" cefrLevel={currentEntry.cefr}>{currentEntry.cefr}</GlassBadge>}
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs">
                  {currentEntry.ipaUS && (
                    <button type="button" onClick={() => speechService.speak(currentEntry.query, "US")} className="group flex items-center gap-1 text-slate-300 hover:text-cyan-300 transition-colors" title="Phát âm Mỹ (US)">
                      <span className="text-[10px] font-bold px-1 rounded bg-white/[0.08] text-slate-400 group-hover:text-cyan-200">US</span>
                      <span className="font-mono text-[11px] text-slate-300">{currentEntry.ipaUS}</span>
                      <Volume2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </button>
                  )}
                  {currentEntry.ipaUK && (
                    <button type="button" onClick={() => speechService.speak(currentEntry.query, "UK")} className="group flex items-center gap-1 text-slate-300 hover:text-cyan-300 transition-colors" title="Phát âm Anh (UK)">
                      <span className="text-[10px] font-bold px-1 rounded bg-white/[0.08] text-slate-400 group-hover:text-cyan-200">UK</span>
                      <span className="font-mono text-[11px] text-slate-300">{currentEntry.ipaUK}</span>
                      <Volume2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 pt-0.5">
                <button type="button" onClick={handleToggleSave} title={isSaved ? "Đã lưu (Nhấn để xóa khỏi Sổ từ)" : "Lưu vào Sổ từ (Ctrl+S)"} className={`p-1.5 rounded-xl border transition-all active:scale-90 ${isSaved ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]" : "bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-400 hover:text-white"}`}>
                  {isSaved ? <BookmarkCheck className="w-4 h-4 text-cyan-300" /> : <Bookmark className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => copyToClipboard(currentEntry.query)} title={copied ? "Đã sao chép!" : "Sao chép từ"} className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {currentEntry.partsOfSpeech.map((pos, pIdx) => (
                <div key={pIdx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GlassBadge variant="pos">{pos.type}</GlassBadge>
                    {pos.forms && pos.forms.length > 0 && <span className="text-[11px] text-slate-400 italic">({pos.forms.join(", ")})</span>}
                  </div>
                  <div className="space-y-1">
                    {pos.meanings.map((meaning, mIdx) => <MeaningCard key={mIdx} meaning={meaning} index={mIdx} />)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1">
              {currentEntry.wordFamily && currentEntry.wordFamily.length > 0 && (
                <ExpandableSection title="Gia đình từ (Word Family)" count={currentEntry.wordFamily.length} icon="family">
                  <WordFamilyList items={currentEntry.wordFamily} />
                </ExpandableSection>
              )}

              {((currentEntry.synonyms && currentEntry.synonyms.length > 0) || (currentEntry.antonyms && currentEntry.antonyms.length > 0)) && (
                <ExpandableSection title="Từ đồng nghĩa & Trái nghĩa" icon="synonyms">
                  <div className="space-y-2">
                    {currentEntry.synonyms && currentEntry.synonyms.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Đồng nghĩa:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentEntry.synonyms.map((s, idx) => <button key={idx} type="button" onClick={() => store.submitQuery(s)} className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors">{s}</button>)}
                        </div>
                      </div>
                    )}
                    {currentEntry.antonyms && currentEntry.antonyms.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-rose-400 tracking-wider">Trái nghĩa:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentEntry.antonyms.map((a, idx) => <button key={idx} type="button" onClick={() => store.submitQuery(a)} className="text-xs px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors">{a}</button>)}
                        </div>
                      </div>
                    )}
                  </div>
                </ExpandableSection>
              )}

              {currentEntry.commonMistakes && currentEntry.commonMistakes.length > 0 && (
                <ExpandableSection title="Lỗi thường gặp của người Việt" count={currentEntry.commonMistakes.length} icon="mistakes">
                  <CommonMistakesList mistakes={currentEntry.commonMistakes} />
                </ExpandableSection>
              )}

              {currentEntry.mnemonic && (
                <ExpandableSection title="Mẹo ghi nhớ (Mnemonic)" icon="mnemonic">
                  <GlassSurface variant="inset" className="p-2.5 border-amber-500/20 bg-amber-500/5 text-amber-200 text-xs leading-relaxed">{currentEntry.mnemonic}</GlassSurface>
                </ExpandableSection>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 mt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span>Phím tắt:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 text-[10px] text-slate-300 font-mono">{settings.globalShortcut}</kbd>
        </div>
        <button type="button" onClick={() => store.setWindowMode("study")} className="group flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 font-medium transition-colors">
          <span>Mở Sổ học tập</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </GlassSurface>
  );
};
