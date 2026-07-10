import { forwardRef, type HTMLAttributes } from "react";

export type AvatarRingProps = {
  initials: string;
  size?: number;
  className?: string;
};

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
        background:
          "conic-gradient(from 200deg, #0284c7, #a855f7, #38bdf8, #0284c7)",
      }}
      {...props}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-deep">
        <span
          className="font-bold text-ink-strong"
          style={{ fontSize: size * 0.34 }}
        >
          {initials}
        </span>
      </div>
    </div>
  );
});

AvatarRing.displayName = "AvatarRing";
