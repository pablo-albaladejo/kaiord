import { useSetupChecklist } from "../../../hooks/use-setup-checklist";
import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { SetupChecklistProgress } from "./SetupChecklistProgress";
import { SetupChecklistRow } from "./SetupChecklistRow";

/**
 * The "Getting set up" card: four onboarding steps that tick themselves from
 * real persisted state. Deliberately NOT a modal — it sits in the page flow,
 * never blocks anything, and disappears for good once every item is done or
 * the user dismisses it.
 */
export function SetupChecklist() {
  const t = useTranslate("setup");
  const checklist = useSetupChecklist();
  const { items, doneCount, total } = checklist;

  if (checklist.dismissed || checklist.complete) return null;

  const nextId = items.find((item) => !item.done)?.id ?? null;

  return (
    <Card className="bg-surface border-edge p-4" data-testid="setup-checklist">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-ink-strong m-0 text-[15px] font-semibold">
            {t("checklist.title")}
          </p>
          <p className="text-ink-muted m-0 mt-0.5 text-[13px]">
            {t("checklist.progress", { done: doneCount, total })}
          </p>
        </div>
        <button
          type="button"
          onClick={checklist.dismiss}
          aria-label={t("checklist.dismiss")}
          data-testid="setup-checklist-dismiss"
          className="text-ink-muted shrink-0"
        >
          <Icon icon={ICON_MAP.x} size="sm" color="inherit" />
        </button>
      </div>
      <SetupChecklistProgress
        done={doneCount}
        total={total}
        label={t("checklist.progressLabel")}
      />
      <ul className="m-0 mt-3 flex list-none flex-col gap-0.5 p-0">
        {items.map((item) => (
          <SetupChecklistRow
            key={item.id}
            item={item}
            isNext={item.id === nextId}
          />
        ))}
      </ul>
      <p className="border-edge text-ink-muted m-0 mt-3 border-t pt-3 text-[12px]">
        {t("checklist.footnote")}
      </p>
    </Card>
  );
}
