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
      // Layer 1: Authentic translucent Acrylic/Glass window
      variantStyles = `
        lexi-glass-window
        rounded-[24px]
      `;
      break;

    case "card":
      // Content container inside window (subtle contrast, never opaque black)
      variantStyles = `
        lexi-glass-panel hover:bg-white/[0.06] transition-colors
        rounded-[16px]
      `;
      break;

    case "control":
      // Interactive controls (search, pills, buttons)
      variantStyles = `
        lexi-glass-control hover:bg-white/[0.09] active:bg-white/[0.12]
        rounded-[12px]
      `;
      break;

    case "floating":
      // Mode 1: 56x56 Floating Bubble
      variantStyles = `
        lexi-glass-bubble
        rounded-full
      `;
      break;

    case "inset":
      // Inset well (for examples, collocations, tips)
      variantStyles = `
        bg-[rgba(16,20,24,0.22)] border border-white/[0.06]
        rounded-[12px]
      `;
      break;
  }

  return (
    <div
      className={`relative overflow-hidden ${variantStyles} ${className}`}
      {...props}
    >
      {/* Top subtle specular reflection line for realistic frosted glass depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      {glow && (
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-white/[0.03] blur-2xl rounded-full" />
      )}

      {children}
    </div>
  );
};
