import React from "react";
import { useAppStore, store } from "../../store/useAppStore";
import { GlassSurface } from "../glass/GlassSurface";
import { NVIDIA_MODELS } from "../../types/settings";
import { Key, Volume2, Command, Layers, Sliders, ShieldCheck, AlertCircle, Info } from "lucide-react";
import { desktopBridge } from "../../services/desktop/desktopBridge";

const sectionTitle = "flex items-center gap-2 text-slate-100";
const settingRow = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5";
const mutedIcon = "w-4 h-4 text-[var(--accent)] opacity-85";

export const SettingsPanel: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const aiStatus = useAppStore((s) => s.aiStatus);
  const update = (changes: any) => store.updateSettings(changes);

  return (
    <div className="flex flex-col gap-4 pr-1 pb-10 text-xs select-text">
      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className={sectionTitle}>
            <Key className={mutedIcon} />
            <h3 className="text-sm font-bold">Mô hình AI</h3>
          </div>
          {aiStatus.configured ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-200/85 bg-emerald-300/[0.07] px-2 py-0.5 rounded-full border border-emerald-200/[0.10]">
              <ShieldCheck className="w-3.5 h-3.5" /> Đã kết nối NVIDIA API
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-100/80 bg-amber-200/[0.06] px-2 py-0.5 rounded-full border border-amber-100/[0.10]">
              <AlertCircle className="w-3.5 h-3.5" /> Đang dùng dữ liệu demo
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { model: NVIDIA_MODELS.FAST, title: "DeepSeek V4 Flash", desc: "Nhanh, phù hợp tra từ và ví dụ. Đây là lựa chọn mặc định." },
            { model: NVIDIA_MODELS.QUALITY, title: "DeepSeek V4 Pro", desc: "Dùng khi cần đánh giá câu hoặc phân tích ngữ cảnh sâu hơn." },
          ].map((item) => {
            const selected = settings.defaultModel === item.model;
            return (
              <button
                key={item.model}
                type="button"
                onClick={() => update({ defaultModel: item.model })}
                className={`p-3 rounded-xl border text-left transition-all ${selected ? "bg-white/[0.105] border-white/[0.15] text-white" : "bg-white/[0.025] border-white/[0.07] text-slate-300 hover:bg-white/[0.055]"}`}
              >
                <div className="font-semibold flex items-center gap-2">
                  <span>{item.title}</span>
                  {selected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </GlassSurface>

      <GlassSurface variant="card" className="p-4 space-y-2">
        <div className={sectionTitle}>
          <Volume2 className={mutedIcon} />
          <h3 className="text-sm font-bold">Phát âm</h3>
        </div>
        <div className={settingRow}>
          <div>
            <span className="font-semibold block text-slate-100">Giọng mặc định</span>
            <span className="text-[11px] text-slate-400">Dùng cho nút nghe phát âm và bài nghe.</span>
          </div>
          <div className="flex p-1 rounded-xl bg-white/[0.045] border border-white/[0.08]">
            {(["US", "UK"] as const).map((accent) => (
              <button
                key={accent}
                type="button"
                onClick={() => update({ pronunciationAccent: accent })}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${settings.pronunciationAccent === accent ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-white"}`}
              >
                {accent === "US" ? "Mỹ" : "Anh"}
              </button>
            ))}
          </div>
        </div>
      </GlassSurface>

      <GlassSurface variant="card" className="p-4 space-y-1">
        <div className={`${sectionTitle} mb-1`}>
          <Command className={mutedIcon} />
          <h3 className="text-sm font-bold">Cửa sổ & phím tắt</h3>
        </div>

        <div className={`${settingRow} border-b border-white/[0.06]`}>
          <div>
            <span className="font-semibold block text-slate-100">Tra nhanh</span>
            <span className="text-[11px] text-slate-400">Bôi đen một từ rồi dùng phím tắt.</span>
          </div>
          <kbd className="px-2.5 py-1 rounded-lg bg-white/[0.065] border border-white/[0.10] font-mono text-slate-200 font-semibold">{settings.globalShortcut}</kbd>
        </div>

        <div className={`${settingRow} border-b border-white/[0.06]`}>
          <div>
            <span className="font-semibold block text-slate-100">Luôn ở trên cùng</span>
            <span className="text-[11px] text-slate-400">Giữ LexiGlass nổi trên Chrome, PDF, VS Code...</span>
          </div>
          <input
            type="checkbox"
            checked={settings.alwaysOnTop}
            onChange={(e) => {
              const desired = e.target.checked;
              update({ alwaysOnTop: desired });
              if (desired !== store.getState().isPinned) store.togglePin();
            }}
            className="w-4 h-4 accent-slate-300 cursor-pointer"
          />
        </div>

        <div className={`${settingRow} border-b border-white/[0.06]`}>
          <div>
            <span className="font-semibold block text-slate-100">Khởi động cùng Windows</span>
            <span className="text-[11px] text-slate-400">Sẵn sàng tra từ ngay sau khi đăng nhập.</span>
          </div>
          <input type="checkbox" checked={settings.startWithWindows} onChange={(e) => update({ startWithWindows: e.target.checked })} className="w-4 h-4 accent-slate-300 cursor-pointer" />
        </div>

        <div className={settingRow}>
          <div>
            <span className="font-semibold block text-slate-100">Khởi động thu gọn</span>
            <span className="text-[11px] text-slate-400">Mở dưới dạng bong bóng nổi nhỏ.</span>
          </div>
          <input type="checkbox" checked={settings.launchMinimized} onChange={(e) => update({ launchMinimized: e.target.checked })} className="w-4 h-4 accent-slate-300 cursor-pointer" />
        </div>
      </GlassSurface>

      <GlassSurface variant="card" className="p-4 space-y-4">
        <div className={sectionTitle}>
          <Layers className={mutedIcon} />
          <h3 className="text-sm font-bold">Kính mờ</h3>
        </div>
        <p className="text-[11px] text-slate-400 -mt-2">Preview mô phỏng hiệu ứng. Bản Tauri Windows dùng Acrylic thật phía sau WebView.</p>

        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300"><span>Độ trong suốt</span><span className="font-mono text-slate-200">{settings.transparency}%</span></div>
          <input type="range" min={40} max={90} value={settings.transparency} onChange={(e) => update({ transparency: Number(e.target.value) })} className="w-full accent-slate-300 cursor-pointer" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300"><span>Độ mờ hậu cảnh</span><span className="font-mono text-slate-200">{settings.blurAmount}px</span></div>
          <input type="range" min={8} max={36} value={settings.blurAmount} onChange={(e) => update({ blurAmount: Number(e.target.value) })} className="w-full accent-slate-300 cursor-pointer" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300"><span>Ánh phản chiếu</span><span className="font-mono text-slate-200">{settings.glassIntensity}%</span></div>
          <input type="range" min={0} max={100} value={settings.glassIntensity} onChange={(e) => update({ glassIntensity: Number(e.target.value) })} className="w-full accent-slate-300 cursor-pointer" />
        </div>
      </GlassSurface>

      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className={sectionTitle}>
          <Sliders className={mutedIcon} />
          <h3 className="text-sm font-bold">Mục tiêu học tập</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 text-slate-300">
            <span>Từ mới mỗi ngày</span>
            <input type="number" min={1} max={50} value={settings.dailyNewWordTarget} onChange={(e) => update({ dailyNewWordTarget: Number(e.target.value) })} className="w-full p-2 rounded-xl bg-white/[0.055] border border-white/[0.09] text-white outline-none focus:border-white/[0.20]" />
          </label>
          <label className="space-y-1 text-slate-300">
            <span>Mục tiêu ôn tập</span>
            <input type="number" min={5} max={200} value={settings.dailyReviewTarget} onChange={(e) => update({ dailyReviewTarget: Number(e.target.value) })} className="w-full p-2 rounded-xl bg-white/[0.055] border border-white/[0.09] text-white outline-none focus:border-white/[0.20]" />
          </label>
        </div>
      </GlassSurface>

      <GlassSurface variant="inset" className="p-3 space-y-2 text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>Thông tin môi trường</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {desktopBridge.isTauri
            ? "Đang chạy bản Desktop Native (Tauri 2 + Rust). Khóa API được lưu qua lớp bảo mật hệ điều hành."
            : "Đang chạy Browser Preview. Hiệu ứng kính thật xuyên qua ứng dụng khác chỉ xuất hiện trong bản Tauri."}
        </p>
      </GlassSurface>
    </div>
  );
};
