import React, { useState, useEffect } from "react";
import { useAppStore, store } from "../../store/useAppStore";
import { FSRSRating, QueueType, LearningStage } from "../../types/study";
import { calculateNextIntervals } from "../../services/fsrs/fsrsEngine";
import { GlassSurface } from "../glass/GlassSurface";
import { GlassButton } from "../glass/GlassButton";
import { Volume2, Sparkles, Send, Check, X, RotateCcw, Award } from "lucide-react";
import { speechService } from "../../services/pronunciation/speechService";
import { aiService } from "../../services/ai/nvidiaProvider";
import { SentenceEvaluation } from "../../types/dictionary";

const STAGE_NAMES: Record<LearningStage, string> = {
  0: "Giai đoạn 0: Nhập môn từ mới",
  1: "Giai đoạn 1: Nhận diện ý nghĩa",
  2: "Giai đoạn 2: Gợi nhớ chủ động",
  3: "Giai đoạn 3: Ngữ cảnh câu thực tế",
  4: "Giai đoạn 4: Ứng dụng viết câu (AI)",
  5: "Giai đoạn 5: Thành thạo dài hạn",
};

export const FlashcardReview: React.FC = () => {
  const queueType = useAppStore((s) => s.queueType);
  const studyCards = useAppStore((s) => s.studyCards);
  const activeIndex = useAppStore((s) => s.activeCardIndex);
  const isRevealed = useAppStore((s) => s.isAnswerRevealed);
  const savedWords = useAppStore((s) => s.savedWords);
  const settings = useAppStore((s) => s.settings);

  // User input for typing cards
  const [typedAnswer, setTypedAnswer] = useState("");
  const [typedFeedback, setTypedFeedback] = useState<"correct" | "incorrect" | null>(null);

  // Sentence production state
  const [sentenceInput, setSentenceInput] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sentenceEval, setSentenceEval] = useState<SentenceEvaluation | null>(null);

  const currentCard = studyCards[activeIndex];
  const targetSavedWord = savedWords.find((w) => w.id === currentCard?.wordId);
  const currentStage = (targetSavedWord?.learningStage ?? currentCard?.learningStage ?? 0) as LearningStage;

  // Reset inputs when card changes
  useEffect(() => {
    setTypedAnswer("");
    setTypedFeedback(null);
    setSentenceInput("");
    setSentenceEval(null);
  }, [activeIndex]);

  // Audio auto-play for listening card
  useEffect(() => {
    if (currentCard?.type === "listening" && currentCard.audioText) {
      speechService.speak(currentCard.audioText, settings.pronunciationAccent);
    }
  }, [currentCard?.id, currentCard?.type, currentCard?.audioText, settings.pronunciationAccent]);

  // FSRS interval previews
  const intervalPreviews = targetSavedWord
    ? calculateNextIntervals(targetSavedWord.fsrs)
    : { again: "ngay", hard: "1ng", good: "3ng", easy: "7ng" };

  const handleCheckTyped = () => {
    if (!currentCard) return;
    const isMatch = typedAnswer.trim().toLowerCase() === currentCard.expectedAnswer.trim().toLowerCase();
    setTypedFeedback(isMatch ? "correct" : "incorrect");
    store.revealAnswer();
  };

  const handleEvaluateSentence = async () => {
    if (!currentCard || !sentenceInput.trim()) return;
    setIsEvaluating(true);
    try {
      const result = await aiService.evaluateSentence(
        currentCard.word,
        sentenceInput,
        currentCard.vietnameseMeaning,
        settings.defaultModel
      );
      setSentenceEval(result);
      store.revealAnswer();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRating = (rating: FSRSRating) => {
    store.submitCardRating(rating);
  };

  // Keyboard navigation for review
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space" && !isRevealed) {
        e.preventDefault();
        store.revealAnswer();
      } else if (isRevealed) {
        if (e.key === "1") handleRating("again");
        if (e.key === "2") handleRating("hard");
        if (e.key === "3") handleRating("good");
        if (e.key === "4") handleRating("easy");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, activeIndex]);

  // If completed
  if (!currentCard || activeIndex >= studyCards.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shadow-lg">
          <Award className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Hoàn thành phiên ôn tập!</h3>
          <p className="text-xs text-slate-300 max-w-sm">
            Bạn đã ôn tập xong các từ theo lộ trình 5 giai đoạn tiếp thu và thuật toán FSRS.
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <GlassButton variant="secondary" onClick={() => store.restartStudyQueue()}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Ôn tập lại
          </GlassButton>
          <GlassButton variant="primary" onClick={() => store.setStudyTab("notebook")}>
            Về sổ từ vựng
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Queue selector & Progress */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          {(["due", "new", "weak"] as QueueType[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => store.setQueueType(q)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                queueType === q
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {q === "due" ? "Cần ôn tập" : q === "new" ? "Từ mới" : "Từ cần củng cố"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>
            Thẻ {activeIndex + 1} / {studyCards.length}
          </span>
          <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-200"
              style={{ width: `${((activeIndex + 1) / studyCards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Flashcard Body */}
      <div className="flex-1 flex flex-col justify-between py-1 overflow-y-auto custom-scrollbar">
        <GlassSurface
          variant="card"
          className="flex-1 p-5 md:p-6 flex flex-col justify-center items-center text-center relative select-text min-h-[300px]"
        >
          {/* Card Learning Stage Badge & Skill Header */}
          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400">
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-medium">
              {STAGE_NAMES[currentStage] || `Giai đoạn ${currentStage}`}
            </span>
            {targetSavedWord && (
              <span className="text-[10px] text-slate-400 font-mono">
                Độ thuần thục: {targetSavedWord.mastery}%
              </span>
            )}
          </div>

          {/* CARD TYPE 1: Stage 0 / en_to_vi (Introduction / Recognition) */}
          {currentCard.type === "en_to_vi" && (
            <div className="space-y-3 max-w-md my-auto">
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                {currentCard.prompt}
              </h2>
              {currentCard.promptSecondary && (
                <p className="text-xs font-mono text-slate-400">
                  {currentCard.promptSecondary}
                </p>
              )}
              <button
                type="button"
                onClick={() => speechService.speak(currentCard.word, settings.pronunciationAccent)}
                className="p-2 rounded-full bg-white/[0.08] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors mx-auto inline-flex"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {isRevealed && (
                <div className="pt-3 border-t border-white/10 animate-in fade-in duration-150">
                  <span className="text-xs text-slate-400 block uppercase font-mono tracking-wider">
                    Nghĩa tiếng Việt
                  </span>
                  <p className="text-lg font-bold text-cyan-200 mt-1">
                    {currentCard.expectedAnswer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CARD TYPE 2: Stage 2 / vi_to_en (Active recall typing) */}
          {currentCard.type === "vi_to_en" && (
            <div className="space-y-4 max-w-md w-full my-auto">
              <div>
                <span className="text-xs text-slate-400 block uppercase font-mono tracking-wider">
                  Nghĩa tiếng Việt:
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {currentCard.prompt}
                </h2>
                {currentCard.promptSecondary && (
                  <p className="text-xs text-slate-400 mt-1">
                    {currentCard.promptSecondary}
                  </p>
                )}
              </div>

              {/* Typing Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckTyped()}
                  placeholder="Gõ từ tiếng Anh tương ứng..."
                  disabled={isRevealed}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/15 text-sm text-center text-white outline-none focus:border-cyan-400"
                />
                {!isRevealed && (
                  <GlassButton variant="primary" onClick={handleCheckTyped}>
                    Kiểm tra
                  </GlassButton>
                )}
              </div>

              {isRevealed && (
                <div className="pt-3 border-t border-white/10 animate-in fade-in duration-150 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    {typedFeedback === "correct" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-300 font-semibold">
                        <Check className="w-4 h-4" /> Chính xác!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-300 font-semibold">
                        <X className="w-4 h-4" /> Chưa chính xác
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-cyan-200">
                    {currentCard.expectedAnswer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CARD TYPE 3: Stage 3 / Cloze Deletion */}
          {currentCard.type === "cloze" && (
            <div className="space-y-4 max-w-lg w-full my-auto">
              <span className="text-xs text-slate-400 block uppercase font-mono tracking-wider">
                Điền từ vào chỗ trống trong câu:
              </span>
              <p className="text-base text-slate-200 font-medium leading-relaxed italic bg-white/[0.03] p-4 rounded-xl border border-white/10">
                "{currentCard.prompt}"
              </p>
              {currentCard.promptSecondary && (
                <p className="text-xs text-slate-400">
                  Dịch câu: {currentCard.promptSecondary}
                </p>
              )}

              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckTyped()}
                  placeholder="Gõ từ phù hợp..."
                  disabled={isRevealed}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/15 text-sm text-center text-white outline-none focus:border-cyan-400"
                />
                {!isRevealed && (
                  <GlassButton variant="primary" onClick={handleCheckTyped}>
                    Kiểm tra
                  </GlassButton>
                )}
              </div>

              {isRevealed && (
                <div className="pt-2 text-center animate-in fade-in duration-150">
                  <span className="text-xs text-slate-400">Từ cần điền:</span>
                  <p className="text-lg font-bold text-cyan-300">
                    {currentCard.expectedAnswer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CARD TYPE 4: Listening */}
          {currentCard.type === "listening" && (
            <div className="space-y-4 max-w-md w-full my-auto">
              <button
                type="button"
                onClick={() => speechService.speak(currentCard.audioText || currentCard.word, settings.pronunciationAccent)}
                className="w-16 h-16 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 flex items-center justify-center mx-auto transition-transform active:scale-95 shadow-lg"
              >
                <Volume2 className="w-8 h-8" />
              </button>
              <p className="text-xs text-slate-400">
                Nhấp để nghe lại phát âm và gõ từ bạn nghe được:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckTyped()}
                  placeholder="Gõ từ nghe được..."
                  disabled={isRevealed}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/15 text-sm text-center text-white outline-none focus:border-cyan-400"
                />
                {!isRevealed && (
                  <GlassButton variant="primary" onClick={handleCheckTyped}>
                    Kiểm tra
                  </GlassButton>
                )}
              </div>

              {isRevealed && (
                <div className="pt-3 border-t border-white/10 animate-in fade-in duration-150 space-y-1">
                  <p className="text-lg font-bold text-cyan-300">
                    {currentCard.expectedAnswer}
                  </p>
                  <p className="text-xs text-slate-400">
                    Nghĩa: {currentCard.vietnameseMeaning}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CARD TYPE 5: Stage 1 / Meaning in context (Multiple Choice) */}
          {currentCard.type === "context_meaning" && (
            <div className="space-y-4 max-w-md w-full my-auto">
              <span className="text-xs text-slate-400 block uppercase font-mono tracking-wider">
                Chọn nghĩa tiếng Việt chính xác:
              </span>
              <p className="text-sm font-semibold text-white bg-white/[0.03] p-3 rounded-xl border border-white/10">
                {currentCard.prompt}
              </p>
              {currentCard.promptSecondary && (
                <p className="text-xs text-slate-300 italic">{currentCard.promptSecondary}</p>
              )}

              <div className="space-y-2 text-left">
                {currentCard.options?.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => store.revealAnswer()}
                    className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all ${
                      isRevealed
                        ? opt === currentCard.expectedAnswer
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold"
                          : "bg-white/[0.02] border-white/10 text-slate-400 opacity-60"
                        : "bg-white/[0.06] hover:bg-white/[0.1] border-white/10 text-slate-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CARD TYPE 6: Stage 4 / Sentence Production (DeepSeek AI Evaluated) */}
          {currentCard.type === "sentence_production" && (
            <div className="space-y-3 max-w-lg w-full text-left my-auto">
              <div>
                <span className="text-xs text-cyan-300 font-semibold block uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  DeepSeek AI Đánh giá Câu tự viết (Stage 4)
                </span>
                <p className="text-xs text-slate-300 mt-1">{currentCard.prompt}</p>
                {currentCard.promptSecondary && (
                  <p className="text-[11px] text-slate-400">{currentCard.promptSecondary}</p>
                )}
                {currentCard.collocationsHint && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-[10px] text-slate-400">Gợi ý collocations:</span>
                    {currentCard.collocationsHint.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/10 text-slate-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                rows={2}
                placeholder={`Ví dụ: The company took steps to ${currentCard.word}...`}
                className="w-full p-2.5 rounded-xl bg-white/[0.08] border border-white/15 text-xs text-slate-100 outline-none focus:border-cyan-400"
              />

              <div className="flex justify-end">
                <GlassButton
                  variant="primary"
                  onClick={handleEvaluateSentence}
                  disabled={isEvaluating || !sentenceInput.trim()}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {isEvaluating ? "DeepSeek AI đang chấm câu..." : "Gửi câu chấm điểm"}
                </GlassButton>
              </div>

              {sentenceEval && (
                <GlassSurface variant="inset" className="p-3 space-y-2 border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Điểm đánh giá:</span>
                    <span className="text-base font-extrabold text-cyan-300">
                      {sentenceEval.overallScore}/100
                    </span>
                  </div>

                  {/* Criteria grid */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                    <div className="p-1 rounded bg-white/[0.05]">
                      <div className="text-slate-400">Ngữ pháp</div>
                      <div className="font-semibold text-slate-200">{sentenceEval.grammarScore}</div>
                    </div>
                    <div className="p-1 rounded bg-white/[0.05]">
                      <div className="text-slate-400">Ngữ nghĩa</div>
                      <div className="font-semibold text-slate-200">{sentenceEval.meaningScore}</div>
                    </div>
                    <div className="p-1 rounded bg-white/[0.05]">
                      <div className="text-slate-400">Tự nhiên</div>
                      <div className="font-semibold text-slate-200">{sentenceEval.naturalnessScore}</div>
                    </div>
                    <div className="p-1 rounded bg-white/[0.05]">
                      <div className="text-slate-400">Collocation</div>
                      <div className="font-semibold text-slate-200">{sentenceEval.collocationScore}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sentenceEval.vietnameseFeedback}
                  </p>

                  {sentenceEval.betterAlternatives && sentenceEval.betterAlternatives.length > 0 && (
                    <div className="text-[11px] text-slate-400 border-t border-white/10 pt-1.5">
                      <span className="font-semibold text-slate-300">Câu gợi ý tự nhiên hơn: </span>
                      <span className="italic text-cyan-200">
                        "{sentenceEval.betterAlternatives[0]}"
                      </span>
                    </div>
                  )}
                </GlassSurface>
              )}
            </div>
          )}
        </GlassSurface>

        {/* Bottom: Reveal Answer OR FSRS Rating Buttons */}
        <div className="pt-2">
          {!isRevealed ? (
            <GlassButton
              variant="secondary"
              className="w-full py-2.5 text-xs font-semibold"
              onClick={() => store.revealAnswer()}
            >
              Hiện đáp án (Space)
            </GlassButton>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {/* Again */}
              <GlassButton
                variant="danger"
                className="flex flex-col py-2"
                onClick={() => handleRating("again")}
              >
                <span className="font-bold text-xs">Chưa nhớ (1)</span>
                <span className="text-[10px] opacity-80">{intervalPreviews.again}</span>
              </GlassButton>

              {/* Hard */}
              <GlassButton
                variant="secondary"
                className="flex flex-col py-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                onClick={() => handleRating("hard")}
              >
                <span className="font-bold text-xs">Khó (2)</span>
                <span className="text-[10px] opacity-80">{intervalPreviews.hard}</span>
              </GlassButton>

              {/* Good */}
              <GlassButton
                variant="secondary"
                className="flex flex-col py-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                onClick={() => handleRating("good")}
              >
                <span className="font-bold text-xs">Nhớ tốt (3)</span>
                <span className="text-[10px] opacity-80">{intervalPreviews.good}</span>
              </GlassButton>

              {/* Easy */}
              <GlassButton
                variant="primary"
                className="flex flex-col py-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                onClick={() => handleRating("easy")}
              >
                <span className="font-bold text-xs">Rất dễ (4)</span>
                <span className="text-[10px] opacity-80">{intervalPreviews.easy}</span>
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
