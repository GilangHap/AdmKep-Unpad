import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { NOTICE, ROUTES, SITE } from "@/config/site";
import { UnpadLogo } from "@/components/ui/Motif";
import { cn } from "@/lib/cn";
import { useReveal } from "@/lib/useReveal";

/* Slow crossfade between two frames — the page's one moving picture. */
const FRAMES = ["/photos/unpad5.webp", "/photos/unpad6.webp"];

function Crossfade() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;

    const timer = setInterval(() => {
      if (!paused.current && !document.hidden) {
        setIndex((i) => (i + 1) % FRAMES.length);
      }
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {FRAMES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={
            i === 0
              ? "Gedung Rektorat Universitas Padjadjaran"
              : "Gedung Bale Sawala Universitas Padjadjaran"
          }
          width="1600"
          height="2000"
          loading={i === 0 ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-[1600ms] ease-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-brand-deep/70" aria-hidden="true" />
    </div>
  );
}

function Wordmark({ tone = "ink" }) {
  const dark = tone === "light";
  return (
    <Link to="/" className="inline-flex items-center gap-3">
      <span
        className={cn(
          "grid size-11 place-items-center rounded-2xl",
          dark ? "bg-white/15" : "bg-brand-soft",
        )}
      >
        <UnpadLogo size={30} />
      </span>
      <span className="leading-[1.15]">
        <span
          className={cn(
            "block font-display text-[16px] font-semibold tracking-[-0.01em]",
            dark ? "text-white" : "text-ink",
          )}
        >
          E-KEP Unpad
        </span>
        <span
          className={cn(
            "block text-[13px]",
            dark ? "text-white/70" : "text-ink-soft",
          )}
        >
          {SITE.committee}
        </span>
      </span>
    </Link>
  );
}

function PhotoSide() {
  return (
    <aside className="relative hidden overflow-hidden rounded-[var(--radius-card)] lg:block lg:min-h-0">
      <Crossfade />

      <div className="relative flex h-full flex-col justify-between p-8 lg:p-10">
        <div data-reveal>
          <Wordmark tone="light" />
        </div>

        <div className="max-w-[30rem]">
          <span className="mb-5 block h-1.5 w-16 rounded-full bg-primary" aria-hidden="true" />
          <h2
            data-reveal
            className="font-display text-[clamp(1.75rem,1.2rem+1.7vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-white text-balance"
          >
            Protokol ditelaah, keputusan tercatat.
          </h2>
          <p
            data-reveal
            className="mt-4 max-w-[42ch] text-[16px] leading-[1.6] text-white/75"
          >
            Ajukan, pantau, dan terima keputusan kaji etik dalam satu alur kerja —
            bersama Komite Etik Penelitian {SITE.university}.
          </p>
        </div>

        <p data-reveal className="text-[13px] text-white/55">
          {SITE.university} &middot; {SITE.accreditation}
        </p>
      </div>
    </aside>
  );
}

export function AuthShell({ title, subtitle, children, footer }) {
  const ref = useReveal();
  return (
    <div className="min-h-dvh bg-canvas" ref={ref}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-[14px] focus:font-semibold focus:text-white"
      >
        Lompat ke formulir
      </a>

      <div className="mx-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 gap-3 p-3 lg:grid-cols-2">
        <PhotoSide />

        <main
          id="main"
          tabIndex={-1}
          className="flex flex-col rounded-[var(--radius-card)] bg-canvas-deep p-5 sm:p-8 lg:p-10"
        >
          <div className="flex flex-1 items-center justify-center py-4 lg:px-4">
            <div className="w-full max-w-[34rem]">
              <div
                className="rounded-[var(--radius-card)] bg-surface p-6 sm:p-8"
                data-reveal
              >
                <span className="mb-4 block h-1.5 w-16 rounded-full bg-primary" aria-hidden="true" />
                <h1
                  data-reveal
                  className="font-display text-[clamp(1.9rem,1.2rem+2.25vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink text-balance"
                >
                  {title}
                </h1>
                {subtitle ? (
                  <p
                    data-reveal
                    className="mt-3 max-w-[46ch] text-[16px] leading-[1.55] text-ink-soft"
                  >
                    {subtitle}
                  </p>
                ) : null}

                <div className="mt-7">{children}</div>

                {footer ? <div className="mt-7 pt-2">{footer}</div> : null}
              </div>

              <div
                className="mt-3 overflow-hidden rounded-[var(--radius-card)] bg-surface"
                data-reveal
              >
                <div className="grid grid-cols-3 gap-px">
                  {[
                    ["/photos/unpad2.webp", "Gedung kampus Universitas Padjadjaran"],
                    ["/photos/unpad3.webp", "Gedung Bale Sawala Universitas Padjadjaran"],
                    ["/photos/unpad4.webp", "Gedung KSTP Universitas Padjadjaran"],
                  ].map(([src, alt]) => (
                    <img
                      key={src}
                      src={src}
                      alt={alt}
                      width="1600"
                      height="2000"
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px] leading-[1.5] text-ink-soft">
                    {NOTICE.headline}
                  </p>
                  <a
                    href={NOTICE.guide.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-brand-mid hover:text-gold-deep"
                  >
                    Alur pengajuan
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div
            data-reveal
            className="mx-auto flex w-full max-w-[34rem] flex-wrap items-center justify-between gap-3 px-1 text-[13px] text-ink-soft sm:px-2 lg:px-4"
          >
            <div className="lg:hidden">
              <Wordmark />
            </div>
            <span className="hidden lg:inline">
              &copy; {new Date().getFullYear()} {SITE.university}
            </span>
            <a
              href={SITE.publicSiteUrl}
              className="font-medium text-ink-soft underline-offset-4 hover:underline"
            >
              kep.unpad.ac.id
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
