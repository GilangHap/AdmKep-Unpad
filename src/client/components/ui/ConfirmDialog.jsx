import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel = "Hapus",
  busy = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key !== "Tab") return;
      const nodes = panel.current?.querySelectorAll("button:not([disabled])");
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-ink/45"
        onClick={() => !busy && onCancel()}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative w-full max-w-[430px] rounded-[22px] border border-line bg-surface p-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.4)] sm:p-6" /* taste-skill-ignore: dialog is a true floating overlay */
      >
        <div className="flex items-start gap-3.5">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas-deep text-red"
            aria-hidden="true"
          >
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="confirm-title"
              className="font-display text-[17px] font-semibold leading-6 tracking-[-0.01em] text-ink"
            >
              {title}
            </h2>
            <p id="confirm-desc" className="mt-1.5 text-[13.5px] leading-6 text-ink-soft">
              {description}
            </p>
          </div>
        </div>

        {detail ? (
          <p className="mt-4 truncate rounded-xl border border-line bg-canvas px-3 py-2.5 text-[13px] text-ink">
            {detail}
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-[12.5px] font-medium text-red">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Batal
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={busy}>
            {busy ? "Menghapus…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
