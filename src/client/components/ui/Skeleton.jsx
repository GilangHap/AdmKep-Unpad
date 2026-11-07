import { cn } from "@/lib/cn";

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("rounded-lg bg-line/70", className)} />;
}
