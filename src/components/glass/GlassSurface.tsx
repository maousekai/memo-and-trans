import React from "react";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "window" | "card" | "control" | "floating" | "inset";
  glow?: boolean;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  className = "",
  variant = "window",
  glow = false,
  ...props
}) => {
  let variantStyles = "";

  switch (variant) {
    case "window":
      variantStyles = "lexi-glass-window rounded-[24px]";
      break;
    case "card":
      variantStyles = "lexi-glass-panel rounded-[16px]";
      break;
    case "control":
      variantStyles = "lexi-glass-control hover:bg-white/[0.11] active:bg-white/[0.14] rounded-[12px] transition-colors";
      break;
    case "floating":
      variantStyles = "lexi-glass-bubble rounded-full";
      break;
    case "inset":
      variantStyles = "bg-white/[0.035] border border-white/[0.07] rounded-[12px]";
      break;
  }

  return (
    <div className={`relative overflow-hidden ${variantStyles} ${className}`} {...props}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {glow && (
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-52 h-16 bg-white/[0.018] blur-3xl rounded-full" />
      )}
      {children}
    </div>
  );
};
