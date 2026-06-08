import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type TodayHeaderProps = {
  focusDate: Date;
  isFocusToday: boolean;
  onBackToToday: () => void;
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};
const TITLE_OPTIONS: Intl.DateTimeFormatOptions = { weekday: "long" };

export function TodayHeader({
  focusDate,
  isFocusToday,
  onBackToToday,
}: TodayHeaderProps) {
  const eyebrow = focusDate.toLocaleDateString(undefined, DATE_OPTIONS);
  const title = isFocusToday
    ? "Today"
    : focusDate.toLocaleDateString(undefined, TITLE_OPTIONS);

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
          {title}
        </h1>
        {!isFocusToday && (
          <button
            type="button"
            onClick={onBackToToday}
            className="mt-1 rounded-md text-[13px] font-semibold text-sky-400 transition-colors hover:text-sky-300"
          >
            ← Back to Today
          </button>
        )}
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
