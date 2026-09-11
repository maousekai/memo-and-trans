import React from "react";
import { useAppStore, store } from "../../store/useAppStore";
import { GlassSurface } from "../glass/GlassSurface";
import { GlassButton } from "../glass/GlassButton";
import { Calendar, Flame, CheckCircle, TrendingUp, Sparkles, Brain, ArrowRight } from "lucide-react";

export const StudyDashboard: React.FC = () => {
  const savedWords = useAppStore((s) => s.savedWords);
  const stats = store.getStats();

  // Aggregate weaknesses across all words
  let totalMeaningErr = 0;
  let totalSpellingErr = 0;
  let totalListeningErr = 0;
  let totalContextErr = 0;
  let totalProductionErr = 0;

  savedWords.forEach((w) => {
    totalMeaningErr += w.weaknesses.meaningErrors;
    totalSpellingErr += w.weaknesses.spellingErrors;
    totalListeningErr += w.weaknesses.listeningErrors;
    totalContextErr += w.weaknesses.contextErrors;
    totalProductionErr += w.weaknesses.productionErrors;
  });

  const totalErrors =
    totalMeaningErr + totalSpellingErr + totalListeningErr + totalContextErr + totalProductionErr;

  return (
    <div className="flex flex-col h-full space-y-4 select-text">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Words Due Today */}
        <GlassSurface variant="card" className="p-3 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>Cần ôn hôm nay</span>
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {stats.wordsDueToday}
          </span>
        </GlassSurface>

        {/* New Words Today */}
        <GlassSurface variant="card" className="p-3 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Từ mới hôm nay</span>
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {stats.newWordsToday}
          </span>
        </GlassSurface>

        {/* Words Learned */}
        <GlassSurface variant="card" className="p-3 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã thành thạo</span>
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {stats.wordsLearned}
          </span>
        </GlassSurface>

        {/* Retention */}
        <GlassSurface variant="card" className="p-3 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>Tỉ lệ ghi nhớ</span>
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {stats.retentionRate}%
          </span>
        </GlassSurface>

        {/* Streak */}
        <GlassSurface variant="card" className="p-3 flex flex-col gap-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Chuỗi ngày học</span>
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {stats.currentStreak} ngày
          </span>
        </GlassSurface>
      </div>

      {/* Main Review Callout */}
      <GlassSurface variant="card" className="p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Thuật toán lặp lại ngắt quãng FSRS</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed">
            Hệ thống đã tính toán chính xác độ trôi của trí nhớ (memory decay) để lên lịch ôn tập cho {stats.wordsDueToday} từ cần củng cố.
          </p>
        </div>
        <GlassButton
          variant="primary"
          onClick={() => {
            store.setQueueType("due");
            store.setStudyTab("flashcards");
          }}
          className="whitespace-nowrap font-medium"
        >
          <span>Bắt đầu ôn tập</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </GlassButton>
      </GlassSurface>

      {/* Mistake-Based Smart Learning Diagnostics */}
      <GlassSurface variant="card" className="p-4 flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Phân tích lỗi sai & lỗ hổng từ vựng (Mistake-based Profiling)
          </h4>
          <span className="text-[11px] text-slate-400">
            Tổng cộng {totalErrors} lỗi đã ghi nhận
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          LexiGlass tự động điều chỉnh dạng bài học theo quy trình 5 giai đoạn: bắt đầu từ nhận diện nghĩa, tăng cường điền câu Cloze, luyện chính tả chủ động, và kích hoạt DeepSeek AI để chấm điểm đặt câu (Stage 4) khi từ vựng đã tích lũy đủ độ nhớ.
        </p>

        {/* Error Breakdown Bars */}
        <div className="space-y-2 pt-1 text-xs">
          {/* Meaning */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Hiểu sai nghĩa từ (Meaning)</span>
              <span>{totalMeaningErr} lần</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${totalErrors > 0 ? (totalMeaningErr / totalErrors) * 100 : 20}%` }}
              />
            </div>
          </div>

          {/* Spelling */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Chính tả khi viết (Spelling)</span>
              <span>{totalSpellingErr} lần</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-rose-400"
                style={{ width: `${totalErrors > 0 ? (totalSpellingErr / totalErrors) * 100 : 15}%` }}
              />
            </div>
          </div>

          {/* Listening */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Nhận diện khi nghe (Listening)</span>
              <span>{totalListeningErr} lần</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-sky-400"
                style={{ width: `${totalErrors > 0 ? (totalListeningErr / totalErrors) * 100 : 10}%` }}
              />
            </div>
          </div>

          {/* Production */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Áp dụng vào câu văn (Sentence Production)</span>
              <span>{totalProductionErr} lần</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-purple-400"
                style={{ width: `${totalErrors > 0 ? (totalProductionErr / totalErrors) * 100 : 35}%` }}
              />
            </div>
          </div>
        </div>
      </GlassSurface>
    </div>
  );
};
