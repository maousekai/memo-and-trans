import React, { useState } from "react";
import { Headphones, Loader2, Volume2, Waves } from "lucide-react";
import { useAppStore, store } from "../../store/useAppStore";
import { NVIDIA_TTS, SpeechProvider } from "../../types/settings";
import { speechService } from "../../services/pronunciation/speechService";
import { GlassSurface } from "../glass/GlassSurface";

export const SpeechProviderSettings: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const aiStatus = useAppStore((s) => s.aiStatus);
  const [testing, setTesting] = useState(false);

  const update = (changes: any) => store.updateSettings(changes);

  const testVoice = async () => {
    setTesting(true);
    try {
      await speechService.speak(
        "Clear pronunciation helps you remember vocabulary in real context.",
        settings.pronunciationAccent,
      );
    } finally {
      window.setTimeout(() => setTesting(false), 700);
    }
  };

  const providers: { id: SpeechProvider; title: string; desc: string }[] = [
    {
      id: "nvidia-magpie",
      title: "NVIDIA Magpie AI",
      desc: "Giọng AI tự nhiên qua NVIDIA NIM; tự fallback sang giọng Windows nếu mạng/API lỗi.",
    },
    {
      id: "system",
      title: "Giọng Windows",
      desc: "Phát âm local, phản hồi nhanh và không dùng quota API.",
    },
  ];

  return (
    <GlassSurface variant="card" className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-100">
          <Waves className="w-4 h-4 text-sky-200/90" />
          <div>
            <h3 className="text-sm font-bold">Giọng đọc AI</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dùng cho tra từ, ví dụ, Ôn tập và Từ mới/Từ cần củng cố.
            </p>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full border ${
          settings.speechProvider === "nvidia-magpie"
            ? "text-sky-100 bg-sky-200/[0.06] border-sky-100/[0.12]"
            : "text-slate-300 bg-white/[0.04] border-white/[0.10]"
        }`}>
          {settings.speechProvider === "nvidia-magpie" ? "NVIDIA Speech" : "Local"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {providers.map((provider) => {
          const active = settings.speechProvider === provider.id;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => update({ speechProvider: provider.id })}
              className={`p-3 rounded-xl border text-left transition-colors ${
                active
                  ? "bg-sky-100/[0.09] border-sky-100/[0.20] text-white"
                  : "bg-white/[0.035] border-white/[0.09] text-slate-300 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs">
                {provider.id === "nvidia-magpie" ? (
                  <Headphones className="w-4 h-4 text-sky-200" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-300" />
                )}
                {provider.title}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{provider.desc}</p>
            </button>
          );
        })}
      </div>

      {settings.speechProvider === "nvidia-magpie" && (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end pt-1">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-200">Voice</span>
            <select
              value={settings.speechVoice}
              onChange={(e) => update({ speechVoice: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-900/75 border border-white/[0.12] text-xs text-slate-100 outline-none"
            >
              {NVIDIA_TTS.VOICES.map((voice) => (
                <option key={voice} value={voice}>
                  {voice.split(".").pop()} · en-US
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={testVoice}
            disabled={testing}
            className="h-9 px-3 rounded-xl bg-white/[0.09] hover:bg-white/[0.14] border border-white/[0.12] text-xs text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
            Nghe thử
          </button>
        </div>
      )}

      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-slate-300">
          <span>Tốc độ đọc</span>
          <span className="font-mono">{settings.speechRate.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={0.75}
          max={1.1}
          step={0.05}
          value={settings.speechRate}
          onChange={(e) => update({ speechRate: Number(e.target.value) })}
          className="w-full accent-sky-200 cursor-pointer"
        />
      </div>

      <p className="text-[10px] leading-relaxed text-slate-500 border-t border-white/[0.07] pt-2">
        NVIDIA Magpie dùng cùng NVIDIA API key đã lưu trong LexiGlass. Nếu chưa có key
        ({aiStatus.configured ? "hiện đã kết nối" : "hiện chưa kết nối"}) hoặc request lỗi,
        LexiGlass tự chuyển sang giọng hệ thống. Chế độ Anh (UK) cũng dùng giọng hệ thống để giữ đúng accent.
      </p>
    </GlassSurface>
  );
};
