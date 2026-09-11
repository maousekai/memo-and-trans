import React from "react";

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: "cefr" | "pos" | "freq" | "mastery" | "default";
  cefrLevel?: string | null;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = "default",
  cefrLevel,
  className = "",
}) => {
  let style = "bg-white/[0.05] text-slate-300 border-white/10";

  if (variant === "cefr" || cefrLevel) {
    const level = (cefrLevel || String(children)).toUpperCase();
    if (level === "C2" || level === "C1") {
      style = "bg-purple-500/10 text-purple-200/90 border-purple-500/20";
    } else if (level === "B2" || level === "B1") {
      style = "bg-sky-500/10 text-sky-200/90 border-sky-500/20";
    } else {
      style = "bg-emerald-500/10 text-emerald-200/90 border-emerald-500/20";
    }
  } else if (variant === "pos") {
    style = "bg-amber-500/8 text-amber-200/85 border-amber-500/18";
  } else if (variant === "freq") {
    style = "bg-teal-500/8 text-teal-200/85 border-teal-500/18";
  } else if (variant === "mastery") {
    style = "bg-emerald-500/10 text-emerald-200/90 border-emerald-500/20";
  }

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide
        border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
        ${style}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
