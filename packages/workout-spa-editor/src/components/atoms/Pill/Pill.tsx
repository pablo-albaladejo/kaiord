import { forwardRef, type HTMLAttributes } from "react";

import { Icon, ICON_MAP, type IconName } from "../Icon";

export type PillTone = "neutral" | "accent" | "accentSolid";

export type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
  icon?: IconName;
};

const toneClasses: Record<PillTone, string> = {
  neutral: "bg-ink-strong/5 text-ink-body border-edge",
  accent: "bg-primary-800 text-accent border-transparent",
  accentSolid: "bg-primary-500 text-white border-transparent",
};

/* Small rounded tag/chip with an optional leading icon. Distinct from the
   domain `Badge` (which carries intensity/target semantics): Pill is a
   generic redesign chip used for AI provenance, "Connect", and filters. */
export const Pill = forwardRef<HTMLSpanElement, PillProps>(
  ({ tone = "neutral", icon, className = "", children, ...props }, ref) => {
    const classes = [
      "inline-flex items-center gap-[5px] rounded-full border px-[10px] py-[5px] text-[12.5px] font-semibold leading-none",
      toneClasses[tone],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} {...props}>
        {icon && (
          <Icon
            icon={ICON_MAP[icon]}
            size="xs"
            color="inherit"
            strokeWidth={2.2}
          />
        )}
        {children}
      </span>
    );
  }
);

Pill.displayName = "Pill";
