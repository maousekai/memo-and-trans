import React from "react";
import { Volume2 } from "lucide-react";
import type { DictionaryEntry } from "../../types/dictionary";
import { speechService } from "../../services/pronunciation/speechService";

export function DictionaryPronunciation({ entry }: {
  entry: Pick<DictionaryEntry, "query" | "ipa" | "ipaUS" | "ipaUK">;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1 text-xs">
      {entry.ipa && <span className="font-mono text-[11px] text-slate-300">IPA {entry.ipa}</span>}
      {(["US", "UK"] as const).map((accent) => {
        const label = accent === "US" ? "Phát âm Mỹ (US)" : "Phát âm Anh (UK)";
        const ipa = accent === "US" ? entry.ipaUS : entry.ipaUK;
        return (
          <button key={accent} type="button" title={label} aria-label={label}
            onClick={() => speechService.speak(entry.query, accent)}
            className="group flex items-center gap-1 text-slate-300 hover:text-cyan-300 transition-colors">
            <span className="text-[10px] font-bold px-1 rounded bg-white/[0.08] text-slate-400 group-hover:text-cyan-200">{accent}</span>
            {ipa && <span className="font-mono text-[11px] text-slate-300">{ipa}</span>}
            <Volume2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </button>
        );
      })}
    </div>
  );
}
