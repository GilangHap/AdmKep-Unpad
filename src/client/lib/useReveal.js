import { useEffect, useRef } from "react";

/**
 * Staggered entrance: each child marked with data-reveal rises 14px and fades in,
 * 70ms apart, once. Content is visible by default if the script or observer fails.
 */
export function useReveal(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = [...root.querySelectorAll("[data-reveal]")];
    if (!items.length) return undefined;

    if (reduce) {
      items.forEach((el) => el.classList.add("reveal-in"));
      return undefined;
    }

    items.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${i * 70}ms`;
    });

    // Fire on the next frame so the initial state paints first — the stagger is visible
    // even when the card is already in view on load.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        items.forEach((el) => el.classList.add("reveal-in"));
      });
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          items.forEach((el) => el.classList.add("reveal-in"));
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
