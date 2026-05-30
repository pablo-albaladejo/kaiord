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
        "flex gap-1 rounded-[14px] border border-slate-700/60 bg-surface-deep p-1",
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
              "flex flex-1 items-center justify-center gap-[7px] rounded-[10px] px-1.5 py-[9px] text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              active
                ? "bg-primary-500 text-white"
                : "bg-transparent text-slate-400",
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
