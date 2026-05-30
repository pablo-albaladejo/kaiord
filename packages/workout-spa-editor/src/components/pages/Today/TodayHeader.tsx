import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type TodayHeaderProps = {
  now: Date;
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

export function TodayHeader({ now }: TodayHeaderProps) {
  const eyebrow = now.toLocaleDateString(undefined, DATE_OPTIONS);

  return (
    <header className="flex items-start justify-between pt-2">
      <div>
        <p className="text-[13px] font-semibold text-slate-500 m-0">
          {eyebrow}
        </p>
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-[28px] font-bold tracking-[-0.02em] text-slate-50 m-0"
        >
          Today
        </h1>
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300"
      >
        <Icon icon={ICON_MAP.bell} size="md" color="inherit" />
      </button>
    </header>
  );
}
