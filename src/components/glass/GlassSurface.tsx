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
      variantStyles = "lexi-glass-window rounded-[20px]";
      break;
    case "card":
      variantStyles = "lexi-glass-panel rounded-[16px]";
      break;
    case "control":
      variantStyles = "lexi-glass-control hover:bg-white/[0.10] active:bg-white/[0.13] rounded-[12px] transition-colors";
      break;
    case "floating":
      variantStyles = "lexi-glass-bubble rounded-full";
      break;
    case "inset":
      variantStyles = "bg-white/[0.025] border border-white/[0.075] rounded-[12px]";
      break;
  }

  return (
    <div className={`relative overflow-hidden ${variantStyles} ${className}`} {...props}>
      {glow && (
        <div className="pointer-events-none absolute -top-12 left-[12%] w-40 h-16 bg-white/[0.025] blur-3xl rounded-full" />
      )}
      {children}
    </div>
  );
};
