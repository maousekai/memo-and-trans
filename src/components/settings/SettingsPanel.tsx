import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Command,
  Eye,
  EyeOff,
  Info,
  Key,
  Layers,
  Loader2,
  ShieldCheck,
  Sliders,
  Trash2,
} from "lucide-react";
import { GlassSurface } from "../glass/GlassSurface";
import { TranslationSettingsCard } from "./TranslationSettingsCard";
import { SpeechProviderSettings } from "./SpeechProviderSettings";
import { useAppStore, store } from "../../store/useAppStore";
import { NVIDIA_MODELS } from "../../types/settings";
import { desktopBridge } from "../../services/desktop/desktopBridge";
import { aiService } from "../../services/ai/nvidiaProvider";

const sectionTitle = "flex items-center gap-2 text-slate-100";
const settingRow = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5";
const mutedIcon = "w-4 h-4 text-slate-300 opacity-80";

export const SettingsPanel: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const aiStatus = useAppStore((s) => s.aiStatus);
  const update = (changes: any) => store.updateSettings(changes);

  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiBusy, setApiBusy] = useState(false);
  const [apiMessage, setApiMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const saveAndTestApiKey = async () => {
    if (!apiKey.trim()) {
      setApiMessage({ ok: false, text: "Hãy nhập NVIDIA API key trước." });
      return;
    }
    if (!desktopBridge.isTauri) {
      setApiMessage({ ok: false, text: "Browser Preview không lưu key. Hãy dùng bản Desktop Windows." });
      return;
    }

    setApiBusy(true);
    setApiMessage(null);
    try {
      await aiService.saveApiKey(apiKey.trim());
      await aiService.testConnection(settings.defaultModel);
      await store.init();
      setApiKey("");
      setApiMessage({ ok: true, text: "Kết nối NVIDIA API thành công." });
    } catch (error: any) {
      setApiMessage({ ok: false, text: String(error?.message || error || "Không thể kết nối NVIDIA API.") });
    } finally {
      setApiBusy(false);
    }
  };

  const removeApiKey = async () => {
    if (!desktopBridge.isTauri) return;
    setApiBusy(true);
    try {
      await aiService.saveApiKey("");
      await store.init();
      setApiMessage({ ok: true, text: "Đã xóa NVIDIA API key khỏi máy." });
    } catch (error: any) {
      setApiMessage({ ok: false, text: String(error?.message || error) });
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pr-1 pb-10 text-xs select-text min-w-0">
      <TranslationSettingsCard />

      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className={sectionTitle}>
            <Key className={mutedIcon} />
            <div>
              <h3 className="text-sm font-bold">NVIDIA API</h3>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">Riva Translate v2 cho dịch; Nemotron cho tra AI/phân tích; Magpie cho TTS.</p>
            </div>
          </div>
          {aiStatus.configured ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-200/90 bg-emerald-300/[0.06] px-2 py-1 rounded-full border border-emerald-200/[0.10]">
              <ShieldCheck className="w-3.5 h-3.5" /> Đã kết nối
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-100/85 bg-amber-200/[0.05] px-2 py-1 rounded-full border border-amber-100/[0.10]">
              <AlertCircle className="w-3.5 h-3.5" /> Chưa kết nối
            </span>
          )}
        </div>

        {desktopBridge.isTauri ? (
          <>
            <div className="flex gap-2 min-w-0">
              <div className="relative flex-1 min-w-0">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !apiBusy) saveAndTestApiKey();
                  }}
                  placeholder={aiStatus.configured ? "Nhập key mới để thay thế…" : "nvapi-…"}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full h-10 pl-3 pr-10 rounded-xl bg-white/[0.055] border border-white/[0.10] text-slate-100 placeholder:text-slate-500 outline-none focus:border-white/[0.22]"
                />
                <button type="button" onClick={() => setShowApiKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="button" onClick={saveAndTestApiKey} disabled={apiBusy || !apiKey.trim()} className="h-10 px-3.5 rounded-xl bg-white/[0.11] hover:bg-white/[0.16] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.13] text-white font-semibold whitespace-nowrap flex items-center gap-1.5">
                {apiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Lưu & kiểm tra
              </button>
            </div>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-[540px]">Key được lưu bằng Windows Credential Manager/Keyring, không lưu trong localStorage.</p>
              {aiStatus.configured && (
                <button type="button" disabled={apiBusy} onClick={removeApiKey} className="text-[11px] text-rose-200/80 hover:text-rose-100 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-300/[0.06]">
                  <Trash2 className="w-3.5 h-3.5" /> Ngắt kết nối
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-slate-400 leading-relaxed">Browser Preview chỉ dùng biến môi trường phía server. API key chỉ nhập trực tiếp ở bản Desktop Windows.</p>
        )}

        {apiMessage && (
          <div className={`text-[11px] px-3 py-2 rounded-xl border ${apiMessage.ok ? "text-emerald-100 bg-emerald-300/[0.05] border-emerald-200/[0.10]" : "text-rose-100 bg-rose-300/[0.05] border-rose-200/[0.10]"}`}>{apiMessage.text}</div>
        )}

        <div className="pt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { model: NVIDIA_MODELS.FAST, title: "Nemotron 3.5 Lightning", desc: "Model NVIDIA dùng cho tra AI và phân tích nền. Dịch chính dùng Riva Translate v2." },
          ].map((item) => {
            const selected = settings.defaultModel === item.model;
            return (
              <button key={item.model} type="button" onClick={() => update({ defaultModel: item.model })} className={`p-3 rounded-xl border text-left transition-all ${selected ? "bg-white/[0.10] border-white/[0.15] text-white" : "bg-white/[0.025] border-white/[0.07] text-slate-300 hover:bg-white/[0.055]"}`}>
                <div className="font-semibold flex items-center gap-2"><span>{item.title}</span>{selected && <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </GlassSurface>

      <SpeechProviderSettings />

      <GlassSurface variant="card" className="p-4 space-y-1">
        <div className={`${sectionTitle} mb-1`}><Command className={mutedIcon} /><h3 className="text-sm font-bold">Cửa sổ & phím tắt</h3></div>
        <div className={`${settingRow} border-b border-white/[0.06]`}>
          <div><span className="font-semibold block text-slate-100">Tra nhanh / Dịch nhanh</span><span className="text-[11px] text-slate-400">Bôi đen từ, cụm hoặc câu rồi dùng phím tắt.</span></div>
          <kbd className="px-2.5 py-1 rounded-lg bg-white/[0.065] border border-white/[0.10] font-mono text-slate-200 font-semibold">{settings.globalShortcut}</kbd>
        </div>
        <div className={`${settingRow} border-b border-white/[0.06]`}>
          <div><span className="font-semibold block text-slate-100">Luôn ở trên cùng</span><span className="text-[11px] text-slate-400">Giữ LexiGlass nổi trên Chrome, PDF, VS Code…</span></div>
          <input type="checkbox" checked={settings.alwaysOnTop} onChange={(e) => { const desired = e.target.checked; update({ alwaysOnTop: desired }); if (desired !== store.getState().isPinned) store.togglePin(); }} className="w-4 h-4 accent-slate-300 cursor-pointer" />
        </div>
        <div className={`${settingRow} border-b border-white/[0.06]`}>
          <div><span className="font-semibold block text-slate-100">Khởi động cùng Windows</span><span className="text-[11px] text-slate-400">Sẵn sàng tra/dịch sau khi đăng nhập.</span></div>
          <input type="checkbox" checked={settings.startWithWindows} onChange={(e) => update({ startWithWindows: e.target.checked })} className="w-4 h-4 accent-slate-300 cursor-pointer" />
        </div>
        <div className={settingRow}>
          <div><span className="font-semibold block text-slate-100">Khởi động thu gọn</span><span className="text-[11px] text-slate-400">Mở dưới dạng bong bóng nổi nhỏ.</span></div>
          <input type="checkbox" checked={settings.launchMinimized} onChange={(e) => update({ launchMinimized: e.target.checked })} className="w-4 h-4 accent-slate-300 cursor-pointer" />
        </div>
      </GlassSurface>

      <GlassSurface variant="card" className="p-4 space-y-4">
        <div className={sectionTitle}><Layers className={mutedIcon} /><h3 className="text-sm font-bold">Liquid Glass</h3></div>
        <label className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div><span className="font-semibold text-slate-100 block">Bật kính trong suốt</span><span className="text-[11px] text-slate-400">Tắt để dùng nền tối đặc, dễ đọc nhất.</span></div>
          <input type="checkbox" checked={settings.liquidGlassEnabled} onChange={(e) => update({ liquidGlassEnabled: e.target.checked })} className="w-4 h-4 accent-slate-300" />
        </label>
        <div className="space-y-1.5"><div className="flex justify-between text-slate-300"><span>Độ trong suốt</span><span className="font-mono text-slate-200">{settings.transparency}%</span></div><input type="range" min={40} max={90} value={settings.transparency} onChange={(e) => update({ transparency: Number(e.target.value) })} className="w-full accent-slate-300 cursor-pointer" /></div>
        <div className="space-y-1.5"><div className="flex justify-between text-slate-300"><span>Độ mờ hậu cảnh</span><span className="font-mono text-slate-200">{settings.blurAmount}px</span></div><input type="range" min={8} max={36} value={settings.blurAmount} onChange={(e) => update({ blurAmount: Number(e.target.value) })} className="w-full accent-slate-300 cursor-pointer" /></div>
        <div className="space-y-1.5"><div className="flex justify-between text-slate-300"><span>Ánh phản chiếu</span><span className="font-mono text-slate-200">{settings.glassIntensity}%</span></div><input type="range" min={0} max={100} value={settings.glassIntensity} onChange={(e) => update({ glassIntensity: Number(e.target.value) })} className="w-full accent-slate-300 cursor-pointer" /></div>
      </GlassSurface>

      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className={sectionTitle}><Sliders className={mutedIcon} /><h3 className="text-sm font-bold">Mục tiêu học tập</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1 text-slate-300"><span>Từ mới mỗi ngày</span><input type="number" min={1} max={50} value={settings.dailyNewWordTarget} onChange={(e) => update({ dailyNewWordTarget: Number(e.target.value) })} className="w-full p-2 rounded-xl bg-white/[0.055] border border-white/[0.09] text-white outline-none" /></label>
          <label className="space-y-1 text-slate-300"><span>Mục tiêu ôn tập</span><input type="number" min={5} max={200} value={settings.dailyReviewTarget} onChange={(e) => update({ dailyReviewTarget: Number(e.target.value) })} className="w-full p-2 rounded-xl bg-white/[0.055] border border-white/[0.09] text-white outline-none" /></label>
        </div>
      </GlassSurface>

      <GlassSurface variant="inset" className="p-3 space-y-2 text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium"><Info className="w-3.5 h-3.5" /><span>Thông tin môi trường</span></div>
        <p className="text-[11px] leading-relaxed">{desktopBridge.isTauri ? "Desktop Native · Gemini/NVIDIA keys lưu trong Windows Credential Manager · dịch cloud gọi qua Rust backend." : "Browser Preview · API đi qua server proxy · Acrylic xuyên ứng dụng chỉ có trong bản Desktop."}</p>
      </GlassSurface>
    </div>
  );
};
