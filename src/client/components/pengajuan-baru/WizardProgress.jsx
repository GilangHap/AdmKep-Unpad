import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function WizardProgress({ step, labels }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {labels.map((label, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                done && "bg-brand text-white",
                active && "bg-primary text-on-primary",
                !done && !active && "bg-canvas-deep text-ink-faint",
              )}
              aria-hidden="true"
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className={cn("text-[13px]", active ? "font-semibold text-ink" : "text-ink-faint")}>
              {label}
            </span>
            {index < labels.length - 1 ? (
              <span className="hidden h-px w-6 bg-line sm:block" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
