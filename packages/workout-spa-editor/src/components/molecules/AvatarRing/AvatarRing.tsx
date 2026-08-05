import { forwardRef, type HTMLAttributes } from "react";

export type AvatarRingProps = {
  initials: string;
  size?: number;
  className?: string;
};

/* The ring is the athlete's intensity, not decoration: the conic sweep is the
   five-zone training ramp Z1→Z5, closing back on Z1 so the seam has no edge.
   Roles only — the zone tokens carry a separate row per theme. */
const ZONE_SWEEP =
  "conic-gradient(from 200deg, var(--zone-1), var(--zone-2), var(--zone-3), var(--zone-4), var(--zone-5), var(--zone-1))";

const INITIALS_RATIO = 0.3;

export const AvatarRing = forwardRef<
  HTMLDivElement,
  AvatarRingProps & HTMLAttributes<HTMLDivElement>
>(({ initials, size = 64, className = "", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        padding: 2.5,
        background: ZONE_SWEEP,
      }}
      {...props}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-deep">
        <span
          className="font-semibold tracking-[-0.01em] text-ink-strong"
          style={{ fontSize: size * INITIALS_RATIO }}
        >
          {initials}
        </span>
      </div>
    </div>
  );
});

AvatarRing.displayName = "AvatarRing";
