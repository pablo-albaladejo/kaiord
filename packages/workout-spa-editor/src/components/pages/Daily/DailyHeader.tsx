import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type DailyHeaderProps = {
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

export function DailyHeader({
  focusDate,
  isFocusToday,
  onBackToToday,
}: DailyHeaderProps) {
  const t = useTranslate("daily");
  const eyebrow = focusDate.toLocaleDateString(undefined, DATE_OPTIONS);
  const title = isFocusToday
    ? t("header.today")
    : focusDate.toLocaleDateString(undefined, TITLE_OPTIONS);

  return (
    <header className="flex items-start justify-between pt-2">
      <div>
        <p className="text-[13px] font-semibold text-ink-muted m-0">
          {eyebrow}
        </p>
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-[28px] font-bold tracking-[-0.02em] text-ink-strong m-0"
        >
          {title}
        </h1>
        {!isFocusToday && (
          <button
            type="button"
            onClick={onBackToToday}
            className="mt-1 rounded-md text-[13px] font-semibold text-accent transition-colors hover:text-accent"
          >
            {t("header.backToToday")}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label={t("header.notifications")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-strong/5 text-ink-body"
      >
        <Icon icon={ICON_MAP.bell} size="md" color="inherit" />
      </button>
    </header>
  );
}
