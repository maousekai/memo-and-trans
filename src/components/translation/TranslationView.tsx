import React, { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Languages,
  Loader2,
  Search,
  Sparkles,
  Volume2,
  ArrowRight,
  CloudOff,
} from "lucide-react";
import { GlassSurface } from "../glass/GlassSurface";
import { speechService } from "../../services/pronunciation/speechService";
import { store, useAppStore } from "../../store/useAppStore";

export const TranslationView: React.FC = () => {
  const result = useAppStore((s) => s.currentTranslation);
  const queryMode = useAppStore((s) => s.queryMode);
  const isAnalyzing = useAppStore((s) => s.isAnalyzingTranslation);
  const savedPhrases = useAppStore((s) => s.savedPhrases);
  const [copied, setCopied] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);

  if (!result) return null;

  const normalizedSource = result.sourceText.trim().toLowerCase().replace(/\s+/g, " ");
  const alreadySaved = savedPhrases.some((item) => item.normalizedSource === normalizedSource);

  const copyTranslation = async () => {
    await navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const savePhrase = () => {
    store.saveCurrentPhrase();
    setSavedPulse(true);
    window.setTimeout(() => setSavedPulse(false), 1200);
  };

  const modeLabel = queryMode === "translation_paragraph"
    ? "Đoạn văn"
    : queryMode === "translation_sentence"
      ? "Câu"
      : "Cụm từ";

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-cyan-300" />
          <span>Dịch Anh → Việt · {modeLabel}</span>
        </div>
        <span className="normal-case tracking-normal text-slate-500">
          {result.source === "local" ? "Offline" : result.source === "cache" ? "Cache" : result.source === "gemini" ? "Gemini" : "NVIDIA Riva"}
          {result.latencyMs > 0 ? ` · ${result.latencyMs}ms` : ""}
        </span>
      </div>

      <GlassSurface variant="inset" className="p-3.5 border-white/[0.08] bg-black/10">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {result.sourceText}
          </p>
          <button
            type="button"
            onClick={() => speechService.speak(result.sourceText, "US")}
            className="shrink-0 p-2 rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-cyan-200 hover:bg-white/[0.08] transition-colors"
            title="Đọc văn bản tiếng Anh"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </GlassSurface>

      <div className="relative rounded-2xl border border-cyan-400/[0.16] bg-cyan-400/[0.045] p-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-300/75 mb-2">Bản dịch</p>
        <p className="text-[17px] font-semibold leading-relaxed text-white whitespace-pre-wrap break-words">
          {result.translatedText}
        </p>

        <div className="flex items-center gap-1.5 mt-3">
          <button
            type="button"
            onClick={copyTranslation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 border border-white/10 bg-white/[0.045] hover:bg-white/[0.08]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Đã sao chép" : "Sao chép"}
          </button>
          <button
            type="button"
            onClick={savePhrase}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors ${
              alreadySaved
                ? "text-cyan-100 border-cyan-300/[0.22] bg-cyan-300/[0.08]"
                : "text-slate-300 border-white/10 bg-white/[0.045] hover:bg-white/[0.08]"
            }`}
          >
            {alreadySaved || savedPulse ? <BookmarkCheck className="w-3.5 h-3.5 text-cyan-200" /> : <Bookmark className="w-3.5 h-3.5" />}
            {alreadySaved || savedPulse ? "Đã lưu vào Sổ học" : "Lưu cụm/câu"}
          </button>
        </div>
      </div>

      {result.alternativeTranslations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Cách dịch khác</p>
          {result.alternativeTranslations.map((item, index) => (
            <div key={`${item}-${index}`} className="text-xs text-slate-300 px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.025]">
              {item}
            </div>
          ))}
        </div>
      )}

      {result.isPartial && result.segmentCount && result.segmentCount > 1 && (
        <div className="rounded-xl border border-amber-300/[0.15] bg-amber-300/[0.04] px-3 py-2 text-[11px] text-amber-100/80 flex items-center justify-between gap-3">
          <span>
            Đã dịch phần {result.segmentIndex || 1}/{result.segmentCount}. Đoạn được chia theo ranh giới câu/từ, không cắt giữa chữ.
          </span>
          {(result.segmentIndex || 1) < result.segmentCount && (
            <button
              type="button"
              onClick={() => store.translateNextSegment()}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200/[0.18] bg-amber-200/[0.06] hover:bg-amber-200/[0.10] text-amber-50 font-semibold"
            >
              Tiếp tục
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {result.reverseSuggestions && result.reverseSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
            <Search className="w-3.5 h-3.5 text-cyan-300" />
            <span>Có thể bạn đang tìm từ</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.reverseSuggestions.map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => store.submitQuery(item.word)}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-300/[0.14] bg-cyan-300/[0.045] hover:bg-cyan-300/[0.09] text-left"
                title={item.meaning}
              >
                <span className="text-xs font-semibold text-cyan-100">{item.word}</span>
                <span className="text-[10px] text-slate-400 ml-1.5">{item.meaning}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
          <span>Đang bổ sung phân tích cụm, ngữ pháp và từ đáng học…</span>
        </div>
      )}

      {result.analysisStatus === "failed" && result.localStrategy === "composed" && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/[0.14] bg-amber-300/[0.035] px-3 py-2 text-[11px] text-amber-100/75">
          <CloudOff className="w-3.5 h-3.5 shrink-0" />
          <span>AI cloud tạm thời không phản hồi · bản dịch offline vẫn dùng được.</span>
        </div>
      )}

      {result.chunks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Phân tích cụm</span>
          </div>
          <div className="space-y-1.5">
            {result.chunks.map((chunk, index) => (
              <div key={`${chunk.source}-${index}`} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-2 px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.025]">
                <div className="text-xs font-medium text-slate-100 break-words">{chunk.source}</div>
                <div>
                  <div className="text-xs text-cyan-100 break-words">{chunk.target}</div>
                  {chunk.explanation && <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{chunk.explanation}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.keyVocabulary.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-200">Từ đáng học</p>
          <div className="flex flex-wrap gap-1.5">
            {result.keyVocabulary.filter((item) => item.worthLearning).map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => store.submitQuery(item.word)}
                className="px-2.5 py-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08]"
              >
                <span className="text-xs text-white font-semibold">{item.word}</span>
                <span className="ml-1.5 text-[10px] text-slate-400">{item.meaning}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {result.grammarNotes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-200">Ngữ pháp & cách dùng</p>
          {result.grammarNotes.map((note, index) => (
            <div key={`${note.title}-${index}`} className="px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.025]">
              <p className="text-xs font-semibold text-slate-200">{note.title}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{note.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {result.naturalnessNote && (
        <div className="text-[11px] leading-relaxed text-slate-400 px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.02]">
          {result.naturalnessNote}
        </div>
      )}
    </div>
  );
};
