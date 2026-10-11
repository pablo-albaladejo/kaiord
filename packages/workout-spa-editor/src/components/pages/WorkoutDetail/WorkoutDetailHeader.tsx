import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import {
  WorkoutDetailMenu,
  type WorkoutDetailMenuProps,
} from "./WorkoutDetailMenu";

export type WorkoutDetailHeaderProps = WorkoutDetailMenuProps & {
  onBack: () => void;
};

/** Sheet header: back chevron, the route-heading title, and the dots menu. */
export function WorkoutDetailHeader({
  onBack,
  onMove,
  onDelete,
}: WorkoutDetailHeaderProps) {
  const t = useTranslate("workout-detail");
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        aria-label={t("header.back")}
        data-testid="workout-detail-back"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-body hover:bg-ink-strong/5"
      >
        <Icon icon={ICON_MAP.chevL} size="md" color="inherit" />
      </button>
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-[15px] font-semibold text-ink-body"
      >
        {t("header.title")}
      </h1>
      <WorkoutDetailMenu onMove={onMove} onDelete={onDelete} />
    </div>
  );
}
