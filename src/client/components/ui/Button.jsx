import { cn } from "@/lib/cn";

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  fullWidth = false,
  loading = false,
  disabled,
  children,
  ...props
}) {
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-deep active:bg-primary-deep",
    secondary:
      "border border-control bg-surface text-ink hover:border-ink-faint hover:bg-canvas",
    ghost: "text-ink-soft hover:bg-primary-soft hover:text-ink",
  };

  const sizes = {
    sm: "h-9 px-3.5 text-[13px]",
    md: "h-11 px-5 text-[14px]",
    lg: "h-12 px-6 text-[15px]",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold",
        "transition-[background-color,color,transform] duration-200 hover:-translate-y-px active:translate-y-0",
        "disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
