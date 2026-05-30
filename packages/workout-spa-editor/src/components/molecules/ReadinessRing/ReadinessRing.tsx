import { forwardRef, type HTMLAttributes } from "react";

export type ReadinessRingProps = {
  score: number;
  size?: number;
  label?: string;
  className?: string;
};

function ringGeometry(size: number, score: number) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clampedScore / 100);
  return { r, c, offset, clampedScore };
}

export const ReadinessRing = forwardRef<
  HTMLDivElement,
  ReadinessRingProps & HTMLAttributes<HTMLDivElement>
>(({ score, size = 76, label = "READY", className = "", ...props }, ref) => {
  const { r, c, offset, clampedScore } = ringGeometry(size, score);

  return (
    <div
      ref={ref}
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#243244"
          strokeWidth={6}
        />
        <circle
          data-testid="readiness-progress"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#34d399"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold text-slate-50 leading-none tabular-nums">
          {clampedScore}
        </span>
        <span className="text-[9.5px] font-semibold text-slate-500 mt-px">
          {label}
        </span>
      </div>
    </div>
  );
});

ReadinessRing.displayName = "ReadinessRing";
