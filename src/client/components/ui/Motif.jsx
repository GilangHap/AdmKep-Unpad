import { cn } from "@/lib/cn";

/**
 * The University's crest. One asset, used everywhere the brand appears.
 * It is a transparent PNG, so it sits on the canvas, a surface or the photo scrim unchanged.
 */
export function UnpadLogo({ className, size = 38, alt = "Universitas Padjadjaran" }) {
  return (
    <img
      src="/brand/unpad-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 select-none object-contain", className)}
      style={{ width: size, height: size }}
      draggable="false"
    />
  );
}
