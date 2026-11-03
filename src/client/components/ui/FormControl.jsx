import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-xl border bg-canvas px-3.5 text-[16px] text-ink transition-colors duration-200 placeholder:text-ink-faint focus:outline-none focus:bg-surface disabled:cursor-not-allowed disabled:opacity-60";

const state = (invalid) =>
  invalid
    ? "border-red focus:border-red"
    : "border-line focus:border-brand";

export function Input({ invalid, className, ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(base, "h-12 px-3.5", state(invalid), className)}
      {...props}
    />
  );
}

export function PasswordInput({ invalid, className, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        invalid={invalid}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        {visible ? (
          <EyeOff className="size-[18px]" aria-hidden="true" />
        ) : (
          <Eye className="size-[18px]" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export function Select({ invalid, className, children, ...props }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(base, "h-12 cursor-pointer appearance-none pl-3.5 pr-10", state(invalid), className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        aria-hidden="true"
      />
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, required = false, className, children }) {
  const describedBy = error || hint ? `${htmlFor}-desc` : undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[14px] font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-red" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {typeof children === "function" ? children({ describedBy }) : children}
      {error ? (
        <p id={describedBy} role="alert" className="mt-1.5 text-[13px] font-medium text-red">
          {error}
        </p>
      ) : hint ? (
        <p id={describedBy} className="mt-1.5 text-[13px] text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
