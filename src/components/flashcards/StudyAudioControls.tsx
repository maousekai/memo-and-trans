import React from "react";
import { Headphones, MessageSquareText, Volume2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { speechService } from "../../services/pronunciation/speechService";

function getSentenceForCard(card: ReturnType<typeof useCurrentCard>): string | null {
  if (!card) return null;
  if (card.contextSentence) return card.contextSentence;

  if (card.type === "context_meaning" && card.promptSecondary) {
    return card.promptSecondary.replace(/^['\"]|['\"]$/g, "").trim();
  }

  if (card.type === "cloze" && card.prompt) {
    return card.prompt.replace(/_{3,}/g, card.word);
  }

  return null;
}

function useCurrentCard() {
  const cards = useAppStore((s) => s.studyCards);
  const activeIndex = useAppStore((s) => s.activeCardIndex);
  return cards[activeIndex];
}

export const StudyAudioControls: React.FC = () => {
  const currentCard = useCurrentCard();
  const settings = useAppStore((s) => s.settings);
  const sentence = getSentenceForCard(currentCard);

  if (!currentCard) return null;

  return (
    <div
      data-no-window-drag
      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-900/45 border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
    >
      <div className="min-w-0 flex items-center gap-2">
        <Headphones className="w-4 h-4 text-sky-200/85 flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Nghe trong lúc học</div>
          <div className="text-xs text-slate-200 truncate">
            {currentCard.word}
            <span className="text-slate-500"> · dùng được cho Ôn tập / Từ mới / Từ cần củng cố</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          data-no-window-drag
          onClick={() => speechService.speak(currentCard.word, settings.pronunciationAccent)}
          className="h-8 px-2.5 rounded-lg bg-white/[0.07] hover:bg-sky-100/[0.12] border border-white/[0.10] text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-[11px]"
          title="Đọc từ vựng"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Từ
        </button>

        {sentence && (
          <button
            type="button"
            data-no-window-drag
            onClick={() => speechService.speak(sentence, settings.pronunciationAccent)}
            className="h-8 px-2.5 rounded-lg bg-white/[0.07] hover:bg-sky-100/[0.12] border border-white/[0.10] text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-[11px]"
            title="Đọc câu ngữ cảnh"
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            Câu
          </button>
        )}
      </div>
    </div>
  );
};
