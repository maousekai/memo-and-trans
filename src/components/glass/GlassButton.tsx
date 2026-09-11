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
  if (variant === "icon") sizeClasses = size === "sm" ? "w-7 h-7 p-1" : "w-8 h-8 p-1.5";

  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses = `
        bg-[var(--accent-soft)] hover:bg-white/[0.13] active:bg-white/[0.17]
        text-[var(--text-primary)] border border-[var(--accent-border)] hover:border-white/[0.22]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.11),0_3px_10px_rgba(0,0,0,0.16)]
      `;
      break;
    case "secondary":
      variantClasses = `
        bg-white/[0.065] hover:bg-white/[0.105] active:bg-white/[0.14]
        text-[var(--text-primary)] border border-white/[0.09] hover:border-white/[0.16]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]
      `;
      break;
    case "ghost":
      variantClasses = "bg-transparent hover:bg-white/[0.065] active:bg-white/[0.10] text-slate-400 hover:text-slate-100 border border-transparent";
      break;
    case "icon":
      variantClasses = `
        bg-white/[0.055] hover:bg-white/[0.10] active:bg-white/[0.14]
        text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/[0.15]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.065)] rounded-full flex items-center justify-center
      `;
      break;
    case "danger":
      variantClasses = "bg-rose-500/10 hover:bg-rose-500/18 active:bg-rose-500/24 text-rose-200 border border-rose-300/16";
      break;
  }

  if (active) {
    variantClasses += " bg-[var(--accent-soft)] text-white border-[var(--accent-border)] ring-1 ring-white/[0.08]";
  }
  if (disabled) variantClasses += " opacity-40 cursor-not-allowed pointer-events-none";

  return (
    <button
      title={tooltip}
      aria-label={tooltip}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center gap-1.5 transition-all duration-150
        rounded-[14px] select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/20
        active:scale-[0.97] ${sizeClasses} ${variantClasses} ${className}
      `}
      {...props}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-[14px]" />
      {children}
    </button>
  );
};
