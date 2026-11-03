import { Check, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  info: { wrap: "bg-brand/5 text-brand-deep", Icon: Info },
  success: { wrap: "bg-[#e8f3ec] text-[#12502f]", Icon: Check },
  warning: { wrap: "bg-[#fdf3dd] text-[#7a5500]", Icon: TriangleAlert },
  error: { wrap: "bg-[#fdeceb] text-[#8c1d16]", Icon: CircleAlert },
};

export function Alert({ tone = "info", title, children, className }) {
  const config = tones[tone] ?? tones.info;
  const Icon = config.Icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-2.5 rounded-xl p-3.5", config.wrap, className)}
    >
      <Icon className="mt-px size-[18px] shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="text-[14px] font-semibold">{title}</p> : null}
        {children ? <div className="text-[13px] leading-[1.5]">{children}</div> : null}
      </div>
    </div>
  );
}
