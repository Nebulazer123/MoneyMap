import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  withGradientBorder?: boolean;
}

export function GlassPanel({
  children,
  className = "",
  withGradientBorder = false,
}: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-md shadow-black/10 transition hover:border-zinc-700 ${className} ${
        withGradientBorder ? "hover:shadow-lg hover:shadow-black/20" : ""
      }`}
    >
      {children}
    </div>
  );
}
