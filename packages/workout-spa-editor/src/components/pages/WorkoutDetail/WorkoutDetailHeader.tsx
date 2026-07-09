import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type WorkoutDetailHeaderProps = {
  onBack: () => void;
};

/** Sheet header: back chevron, the route-heading title, and an inert dots menu. */
export function WorkoutDetailHeader({ onBack }: WorkoutDetailHeaderProps) {
  const t = useTranslate("workout-detail");
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        aria-label={t("header.back")}
        data-testid="workout-detail-back"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/5"
      >
        <Icon icon={ICON_MAP.chevL} size="md" color="inherit" />
      </button>
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-[15px] font-semibold text-slate-200"
      >
        {t("header.title")}
      </h1>
      <button
        type="button"
        aria-label={t("header.moreOptions")}
        disabled
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500"
      >
        <Icon icon={ICON_MAP.dots} size="md" color="inherit" />
      </button>
    </div>
  );
}
