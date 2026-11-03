import { cn } from "@/lib/cn";

const TONES = {
  neutral: "bg-canvas-deep text-ink-soft",
  info: "bg-[#e8eef7] text-brand",
  warning: "bg-[#fffbeb] text-[#8a5a00]",
  danger: "bg-[#fef3f2] text-[#a51f1a]",
  positive: "bg-[#ecfdf3] text-[#0a6b3d]",
};

export function StatusPill({ tone = "neutral", children }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-medium",
        TONES[tone] ?? TONES.neutral,
      )}
    >
      {children}
    </span>
  );
}