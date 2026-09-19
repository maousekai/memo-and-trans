import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Languages, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { GlassSurface } from "../glass/GlassSurface";
import { store, useAppStore } from "../../store/useAppStore";
import { translationService } from "../../services/translation/translationService";
import { desktopBridge } from "../../services/desktop/desktopBridge";

export const TranslationSettingsCard: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const refreshStatus = async () => {
    try {
      const statuses = await translationService.getStatuses();
      setGeminiConfigured(statuses.gemini.configured);
    } catch {
      setGeminiConfigured(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const saveGemini = async () => {
    if (!geminiKey.trim()) {
      setMessage({ ok: false, text: "Hãy nhập Gemini API key." });
      return;
    }
    if (!desktopBridge.isTauri) {
      setMessage({ ok: false, text: "Browser Preview không lưu key. Hãy dùng bản Desktop Windows." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await translationService.saveGeminiApiKey(geminiKey.trim());
      await refreshStatus();
      setGeminiKey("");
      setMessage({ ok: true, text: "Đã lưu Gemini API key an toàn trong Windows Credential Manager." });
    } catch (error: any) {
      setMessage({ ok: false, text: String(error?.message || error || "Không thể lưu Gemini API key.") });
    } finally {
      setBusy(false);
    }
  };

  const removeGemini = async () => {
    if (!desktopBridge.isTauri) return;
    setBusy(true);
    try {
      await translationService.saveGeminiApiKey("");
      await refreshStatus();
      setMessage({ ok: true, text: "Đã xóa Gemini API key khỏi máy." });
    } catch (error: any) {
      setMessage({ ok: false, text: String(error?.message || error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassSurface variant="card" className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-slate-100">
          <Languages className="w-4 h-4 text-cyan-300" />
          <div>
            <h3 className="text-sm font-bold">Dịch cụm, câu & đoạn văn</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Riva Translate v2 dịch chính; Gemini/Nemotron chỉ dự phòng và phân tích.</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${geminiConfigured ? "text-emerald-200 bg-emerald-300/[0.05] border-emerald-200/[0.10]" : "text-slate-400 bg-white/[0.03] border-white/[0.08]"}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {geminiConfigured ? "Gemini đã kết nối" : "Chưa có Gemini key"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
        {(["auto", "gemini", "nvidia"] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => store.updateSettings({ translationProvider: provider })}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${settings.translationProvider === provider ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            {provider === "auto" ? "Tự động · Riva" : provider === "gemini" ? "Gemini" : "NVIDIA Riva"}
          </button>
        ))}
      </div>

      {desktopBridge.isTauri && (
        <div className="flex gap-2 min-w-0">
          <div className="relative flex-1 min-w-0">
            <input
              type={showKey ? "text" : "password"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) saveGemini();
              }}
              placeholder={geminiConfigured ? "Nhập key mới để thay thế…" : "AIza…"}
              autoComplete="off"
              spellCheck={false}
              className="w-full h-10 pl-3 pr-10 rounded-xl bg-white/[0.055] border border-white/[0.10] text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-300/[0.28]"
            />
            <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button type="button" disabled={busy || !geminiKey.trim()} onClick={saveGemini} className="h-10 px-3 rounded-xl bg-white/[0.10] hover:bg-white/[0.15] disabled:opacity-40 border border-white/[0.12] text-white text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Lưu key
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-slate-400 leading-relaxed max-w-[540px]">
          Key Gemini chỉ nằm trong Windows Credential Manager. LexiGlass không lưu key trong localStorage.
        </p>
        {geminiConfigured && desktopBridge.isTauri && (
          <button type="button" disabled={busy} onClick={removeGemini} className="text-[11px] text-rose-200/80 hover:text-rose-100 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-300/[0.06]">
            <Trash2 className="w-3.5 h-3.5" /> Xóa Gemini key
          </button>
        )}
      </div>

      <label className="flex items-center justify-between gap-3 py-2 border-t border-white/[0.06]">
        <div>
          <span className="text-xs font-semibold text-slate-100 block">Chỉ dùng offline</span>
          <span className="text-[11px] text-slate-400">Không gửi văn bản đã chọn tới Gemini/NVIDIA.</span>
        </div>
        <input type="checkbox" checked={settings.translationOfflineOnly} onChange={(e) => store.updateSettings({ translationOfflineOnly: e.target.checked })} className="w-4 h-4 accent-cyan-300" />
      </label>

      <label className="flex items-center justify-between gap-3 py-2 border-t border-white/[0.06]">
        <div>
          <span className="text-xs font-semibold text-slate-100 block">Phân tích sau khi dịch</span>
          <span className="text-[11px] text-slate-400">Bổ sung chunk, từ đáng học và ngữ pháp ở background.</span>
        </div>
        <input type="checkbox" checked={settings.translationAnalysisEnabled} onChange={(e) => store.updateSettings({ translationAnalysisEnabled: e.target.checked })} className="w-4 h-4 accent-cyan-300" />
      </label>

      {message && (
        <div className={`text-[11px] px-3 py-2 rounded-xl border ${message.ok ? "text-emerald-100 bg-emerald-300/[0.05] border-emerald-200/[0.10]" : "text-rose-100 bg-rose-300/[0.05] border-rose-200/[0.10]"}`}>
          {message.text}
        </div>
      )}
    </GlassSurface>
  );
};
