import { Icon, ICON_MAP, type IconName } from "../Icon";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
};

export type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

/* Segmented single-select control (tabs-in-a-pill). Accessible as a
   radiogroup of radio buttons. Switching the value recomputes whatever the
   parent derives from it (e.g. sport thresholds + zone map). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        "flex gap-1 rounded-xl border border-edge bg-surface-deep p-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={[
              "flex flex-1 items-center justify-center gap-[7px] rounded-lg px-1.5 py-[9px] text-[13px] font-medium transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              active
                ? "bg-accent text-surface"
                : "bg-transparent text-ink-muted",
            ].join(" ")}
          >
            {option.icon && (
              <Icon
                icon={ICON_MAP[option.icon]}
                size="sm"
                color="inherit"
                strokeWidth={2}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
