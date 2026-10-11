import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { withOrigin } from "../../../routing/with-origin";
import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

export type FirstRunManualStartsProps = {
  weekId: string;
  /** Opens the wellness entry dialog; the start is hidden without it. */
  onLogWellness?: () => void;
};

const BASE =
  "flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-[13px] font-medium";
const PRIMARY = `${BASE} bg-accent text-surface hover:opacity-90`;
const SECONDARY = `${BASE} border border-edge text-ink-body hover:border-edge-strong hover:text-ink-strong`;

type Start = {
  testId: string;
  labelKey: string;
  icon: IconName;
  onClick: () => void;
};

/** The three ways to put something in Kaiord that need no integration. */
export function FirstRunManualStarts({
  weekId,
  onLogWellness,
}: FirstRunManualStartsProps) {
  const t = useTranslate("calendar");
  const [, navigate] = useLocation();
  const open = (href: string) => () =>
    navigate(withOrigin(href, "calendar", { week: weekId }));
  const starts: Start[] = [
    {
      testId: "first-run-add-workout",
      labelKey: "firstRun.addWorkout",
      icon: "plus",
      onClick: open("/workout/new"),
    },
    {
      testId: "first-run-import",
      labelKey: "firstRun.importFile",
      icon: "upload",
      onClick: open("/workout/new?action=import"),
    },
  ];
  if (onLogWellness)
    starts.push({
      testId: "first-run-log-wellness",
      labelKey: "firstRun.logWellness",
      icon: "heart",
      onClick: onLogWellness,
    });

  return (
    <div className="flex flex-wrap gap-2.5">
      {starts.map((start, index) => (
        <button
          key={start.testId}
          type="button"
          data-testid={start.testId}
          onClick={start.onClick}
          className={index === 0 ? PRIMARY : SECONDARY}
        >
          <Icon icon={ICON_MAP[start.icon]} size="sm" color="inherit" />
          {t(start.labelKey)}
        </button>
      ))}
    </div>
  );
}
