import React, { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Lightbulb, GitFork, ArrowLeftRight } from "lucide-react";
import { WordFamilyItem, CommonMistake } from "../../types/dictionary";
import { GlassSurface } from "../glass/GlassSurface";

interface ExpandableSectionProps {
  title: string;
  count?: number;
  icon?: "family" | "synonyms" | "mistakes" | "mnemonic";
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  count,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const renderIcon = () => {
    switch (icon) {
      case "family":
        return <GitFork className="w-3.5 h-3.5 text-sky-400" />;
      case "synonyms":
        return <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />;
      case "mistakes":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case "mnemonic":
        return <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="border-t border-white/[0.06] pt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.04] text-xs font-semibold text-slate-300 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          {renderIcon()}
          <span>{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-slate-400">
              {count}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="pt-2 pb-1 px-1 text-xs text-slate-300 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

export const WordFamilyList: React.FC<{ items: WordFamilyItem[] }> = ({ items }) => {
  if (!items || items.length === 0) return <span className="text-slate-500 italic">None recorded</span>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {items.map((it, idx) => (
        <GlassSurface key={idx} variant="inset" className="p-2 flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-200">{it.word}</span>
            <span className="text-[10px] italic text-slate-400">{it.type}</span>
          </div>
          <span className="text-[11px] text-slate-300">{it.vietnameseMeaning}</span>
        </GlassSurface>
      ))}
    </div>
  );
};

export const CommonMistakesList: React.FC<{ mistakes: CommonMistake[] }> = ({ mistakes }) => {
  if (!mistakes || mistakes.length === 0) return <span className="text-slate-500 italic">None recorded</span>;
  return (
    <div className="space-y-2">
      {mistakes.map((m, idx) => (
        <GlassSurface
          key={idx}
          variant="inset"
          className="p-2.5 flex flex-col gap-1 border-l-2 border-l-amber-500/80"
        >
          <div className="flex items-center gap-1.5 text-rose-300 line-through text-[11px]">
            <span className="font-bold">✕</span>
            <span>{m.incorrect}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300 font-medium text-[11px]">
            <span className="font-bold">✓</span>
            <span>{m.correct}</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            {m.explanationVietnamese}
          </p>
        </GlassSurface>
      ))}
    </div>
  );
};
