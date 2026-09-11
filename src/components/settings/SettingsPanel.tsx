import React from "react";
import { useAppStore, store } from "../../store/useAppStore";
import { GlassSurface } from "../glass/GlassSurface";
import { NVIDIA_MODELS } from "../../types/settings";
import { Key, Volume2, Command, Layers, Sliders, ShieldCheck, AlertCircle, Info } from "lucide-react";
import { desktopBridge } from "../../services/desktop/desktopBridge";

export const SettingsPanel: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const aiStatus = useAppStore((s) => s.aiStatus);

  const handleUpdate = (updates: any) => {
    store.updateSettings(updates);
  };

  return (
    <div className="flex flex-col space-y-4 pr-1 pb-8 text-xs select-text">
      {/* 1. AI Model & API Configuration */}
      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Mô hình AI & Bảo mật</h3>
          </div>
          {aiStatus.configured ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Đã kích hoạt khóa API
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              Chế độ Demo Từ điển
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-slate-200 font-medium">
            Chọn mô hình suy luận:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleUpdate({ defaultModel: NVIDIA_MODELS.FAST })}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.defaultModel === NVIDIA_MODELS.FAST
                  ? "bg-cyan-500/20 border-cyan-400/50 text-white shadow-sm"
                  : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]"
              }`}
            >
              <div className="font-semibold text-cyan-200 flex items-center justify-between">
                <span>DeepSeek V4 Flash</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300">Khuyến nghị</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Tốc độ phản hồi cực nhanh, tối ưu hóa cho tra từ điển & ví dụ tức thì.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleUpdate({ defaultModel: NVIDIA_MODELS.QUALITY })}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.defaultModel === NVIDIA_MODELS.QUALITY
                  ? "bg-cyan-500/20 border-cyan-400/50 text-white shadow-sm"
                  : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]"
              }`}
            >
              <div className="font-semibold text-cyan-200 flex items-center justify-between">
                <span>DeepSeek V4 Pro</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400">Chất lượng cao</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Phân tích ngữ cảnh sâu sắc, đánh giá câu viết phức tạp và văn phong tinh tế.
              </p>
            </button>
          </div>
        </div>
      </GlassSurface>

      {/* 2. Audio & Pronunciation */}
      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Phát âm & Giọng đọc</h3>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="font-semibold block text-white">Chất giọng mặc định:</span>
            <span className="text-[11px] text-slate-400">
              Hệ thống phát âm chuẩn tiếng Anh bản ngữ
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/10">
            <button
              type="button"
              onClick={() => handleUpdate({ pronunciationAccent: "US" })}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                settings.pronunciationAccent === "US"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mỹ (US)
            </button>
            <button
              type="button"
              onClick={() => handleUpdate({ pronunciationAccent: "UK" })}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                settings.pronunciationAccent === "UK"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Anh (UK)
            </button>
          </div>
        </div>
      </GlassSurface>

      {/* 3. Window & Shortcut Behaviors */}
      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Command className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Cửa sổ & Phím tắt</h3>
        </div>

        {/* Global shortcut */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <span className="font-semibold block text-white">Phím tắt tra nhanh:</span>
            <span className="text-[11px] text-slate-400">
              Bôi đen từ trong bất kỳ ứng dụng nào và nhấn phím tắt
            </span>
          </div>

          <kbd className="px-2.5 py-1 rounded-lg bg-white/[0.08] border border-white/15 font-mono text-cyan-200 font-bold">
            {settings.globalShortcut}
          </kbd>
        </div>

        {/* Always on top */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <span className="font-semibold block text-white">Luôn ở trên cùng (Always on top):</span>
            <span className="text-[11px] text-slate-400">
              Giữ cửa sổ nổi trên các phần mềm khác (Chrome, PDF, VS Code)
            </span>
          </div>

          <input
            type="checkbox"
            checked={settings.alwaysOnTop}
            onChange={(e) => {
              handleUpdate({ alwaysOnTop: e.target.checked });
              store.togglePin();
            }}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
        </div>

        {/* Start with Windows */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <span className="font-semibold block text-white">Khởi động cùng hệ thống:</span>
            <span className="text-[11px] text-slate-400">
              Sẵn sàng tra từ ngay khi khởi động máy
            </span>
          </div>

          <input
            type="checkbox"
            checked={settings.startWithWindows}
            onChange={(e) => handleUpdate({ startWithWindows: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
        </div>

        {/* Launch minimized */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold block text-white">Khởi động ở chế độ bong bóng nhỏ:</span>
            <span className="text-[11px] text-slate-400">
              Chỉ hiện biểu tượng 56px ở góc màn hình
            </span>
          </div>

          <input
            type="checkbox"
            checked={settings.launchMinimized}
            onChange={(e) => handleUpdate({ launchMinimized: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
        </div>
      </GlassSurface>

      {/* 4. Liquid Glass Visual Customization */}
      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Tùy biến hiệu ứng Mặt kính (Liquid Glass)</h3>
        </div>

        {/* Transparency slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300">
            <span>Độ trong suốt nền kính:</span>
            <span className="font-mono text-cyan-300">{settings.transparency}%</span>
          </div>
          <input
            type="range"
            min={40}
            max={90}
            value={settings.transparency}
            onChange={(e) => handleUpdate({ transparency: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Blur Amount slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300">
            <span>Độ mờ quang học (Backdrop Blur):</span>
            <span className="font-mono text-cyan-300">{settings.blurAmount}px</span>
          </div>
          <input
            type="range"
            min={8}
            max={36}
            value={settings.blurAmount}
            onChange={(e) => handleUpdate({ blurAmount: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </GlassSurface>

      {/* 5. Daily Goals */}
      <GlassSurface variant="card" className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Mục tiêu học tập hàng ngày</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-slate-300">Mục tiêu từ mới:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.dailyNewWordTarget}
              onChange={(e) => handleUpdate({ dailyNewWordTarget: Number(e.target.value) })}
              className="w-full p-2 rounded-xl bg-white/[0.06] border border-white/10 text-white outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="space-y-1">
            <span className="text-slate-300">Mục tiêu thẻ ôn tập:</span>
            <input
              type="number"
              min={5}
              max={200}
              value={settings.dailyReviewTarget}
              onChange={(e) => handleUpdate({ dailyReviewTarget: Number(e.target.value) })}
              className="w-full p-2 rounded-xl bg-white/[0.06] border border-white/10 text-white outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>
      </GlassSurface>

      {/* 6. Developer Information Section (Separated at bottom) */}
      <GlassSurface variant="inset" className="p-3 space-y-2 border-white/5 text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Thông tin môi trường runtime</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {desktopBridge.isTauri ? (
            <span>
              Ứng dụng đang chạy ở môi trường <b>Desktop Native (Tauri 2 + Rust)</b>. Khóa bí mật được lưu tại Windows Credential Manager.
            </span>
          ) : (
            <span>
              Ứng dụng đang chạy ở môi trường <b>Browser Preview</b>. Khóa bí mật được bảo vệ qua Server-side Express proxy.
            </span>
          )}
        </p>
      </GlassSurface>
    </div>
  );
};
