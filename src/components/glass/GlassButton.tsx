import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon" | "danger";
  size?: "sm" | "md" | "lg";
  tooltip?: string;
  active?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className = "",
  variant = "secondary",
  size = "md",
  tooltip,
  active = false,
  disabled,
  ...props
}) => {
  let sizeClasses = "px-3.5 py-1.5 text-xs font-medium";
  if (size === "sm") sizeClasses = "px-2.5 py-1 text-[11px] font-medium";
  if (size === "lg") sizeClasses = "px-5 py-2.5 text-sm font-semibold";
  if (variant === "icon") {
    sizeClasses = size === "sm" ? "w-7 h-7 p-1" : "w-8 h-8 p-1.5";
  }

  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses = `
        bg-[rgba(88,204,255,0.16)] hover:bg-[rgba(88,204,255,0.24)] active:bg-[rgba(88,204,255,0.30)] text-[#daf2fe]
        border border-[rgba(88,204,255,0.30)] hover:border-[rgba(88,204,255,0.45)]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.25)]
      `;
      break;
    case "secondary":
      variantClasses = `
        bg-[rgba(42,50,58,0.28)] hover:bg-[rgba(55,65,76,0.38)] active:bg-[rgba(65,77,90,0.45)] text-[rgba(245,248,252,0.92)]
        border border-white/[0.10] hover:border-white/[0.18]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_2px_6px_rgba(0,0,0,0.2)]
      `;
      break;
    case "ghost":
      variantClasses = `
        bg-transparent hover:bg-white/[0.06] active:bg-white/[0.10] text-slate-400 hover:text-slate-100
        border border-transparent
      `;
      break;
    case "icon":
      variantClasses = `
        bg-[rgba(42,50,58,0.22)] hover:bg-[rgba(55,65,76,0.35)] active:bg-white/[0.14] text-slate-300 hover:text-white
        border border-white/[0.08] hover:border-white/[0.16]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
        rounded-full flex items-center justify-center
      `;
      break;
    case "danger":
      variantClasses = `
        bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-200
        border border-rose-500/25 hover:border-rose-400/40
      `;
      break;
  }

  if (active) {
    variantClasses += " ring-1 ring-[rgba(88,204,255,0.35)] bg-[rgba(88,204,255,0.16)] text-[#daf2fe] border-[rgba(88,204,255,0.30)]";
  }

  if (disabled) {
    variantClasses += " opacity-40 cursor-not-allowed pointer-events-none";
  }

  return (
    <button
      title={tooltip}
      aria-label={tooltip}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center gap-1.5 transition-all duration-150
        rounded-[14px] select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(88,204,255,0.4)]
        active:scale-[0.97]
        ${sizeClasses}
        ${variantClasses}
        ${className}
      `}
      {...props}
    >
      {/* Specular highlight */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-[14px]" />
      {children}
    </button>
  );
};
