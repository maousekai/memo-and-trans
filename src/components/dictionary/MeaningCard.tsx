import React from "react";
import { Meaning } from "../../types/dictionary";
import { GlassSurface } from "../glass/GlassSurface";
import { Volume2 } from "lucide-react";
import { speechService } from "../../services/pronunciation/speechService";

interface MeaningCardProps {
  meaning: Meaning;
  index: number;
}

export const MeaningCard: React.FC<MeaningCardProps> = ({ meaning, index }) => {
  return (
    <div className="flex flex-col gap-2 py-2.5 border-b border-white/[0.06] last:border-b-0">
      {/* Number and Vietnamese meaning */}
      <div className="flex items-start gap-2.5">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold text-xs flex items-center justify-center border border-cyan-500/25">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-100 leading-snug">
              {meaning.vietnamese}
            </h4>
            {meaning.register && meaning.register !== "neutral" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/10 italic">
                {meaning.register}
              </span>
            )}
            {meaning.context && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
                {meaning.context}
              </span>
            )}
          </div>

          {/* English definition */}
          <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
            {meaning.englishDefinition}
          </p>
        </div>
      </div>

      {/* Examples */}
      {meaning.examples && meaning.examples.length > 0 && (
        <div className="mt-1 pl-7 space-y-1.5">
          {meaning.examples.map((ex, exIdx) => (
            <GlassSurface
              key={exIdx}
              variant="inset"
              className="p-2 text-xs flex flex-col gap-0.5 group"
            >
              <div className="flex items-start justify-between gap-1">
                <p className="text-slate-200 font-medium leading-relaxed italic">
                  "{ex.english}"
                </p>
                <button
                  type="button"
                  onClick={() => speechService.speak(ex.english, "US")}
                  title="Speak example"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-cyan-300 text-slate-400 transition-opacity"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>
              {ex.vietnamese && (
                <p className="text-slate-400 text-[11px] leading-normal">
                  {ex.vietnamese}
                </p>
              )}
            </GlassSurface>
          ))}
        </div>
      )}

      {/* Collocations */}
      {meaning.collocations && meaning.collocations.length > 0 && (
        <div className="pl-7 mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Collocations:
          </span>
          {meaning.collocations.map((col, colIdx) => (
            <span
              key={colIdx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.08]"
            >
              {col}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
