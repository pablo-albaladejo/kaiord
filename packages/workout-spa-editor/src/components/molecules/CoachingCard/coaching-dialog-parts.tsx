/**
 * Sub-components for CoachingActivityDialog.
 * Extracted to keep file sizes under the lint limit.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { renderCoachingInline } from "../../organisms/CoachingSidebar/coaching-inline";
import { formatCoachingDescription } from "../../organisms/CoachingSidebar/format-coaching-description";

export const DialogHeader = ({ activity }: { activity: CoachingActivity }) => {
  const t = useTranslate("coaching");
  return (
    <div className="flex items-center justify-between">
      <Dialog.Title className="text-lg font-semibold">
        {activity.title}
      </Dialog.Title>
      <Dialog.Close asChild>
        <button
          type="button"
          aria-label={t("dialog.closeAria")}
          className="p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </Dialog.Close>
    </div>
  );
};

export const DialogMeta = ({ activity }: { activity: CoachingActivity }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span>{activity.sport.icon}</span>
    <span>{activity.sport.label}</span>
    {activity.duration && <span>· {activity.duration}</span>}
    <span className="ml-auto rounded bg-rose-200 px-1 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900 dark:text-rose-300">
      {activity.sourceBadge}
    </span>
  </div>
);

export const DialogDescription = ({
  activity,
}: {
  activity: CoachingActivity;
}) => {
  const t = useTranslate("coaching");
  if (activity.description === undefined) {
    return (
      <p
        data-testid="coaching-dialog-description-loading"
        className="text-xs italic text-muted-foreground"
      >
        {t("dialog.loadingDescription")}
      </p>
    );
  }
  if (!activity.description) return null;
  const paragraphs = formatCoachingDescription(activity.description);
  return (
    <div className="space-y-2 border-t border-edge pt-3 text-sm leading-relaxed">
      {paragraphs.map((p, pi) => (
        <p key={pi}>
          {p.inlines.map((inline, ii) =>
            renderCoachingInline(inline, ii, true)
          )}
        </p>
      ))}
    </div>
  );
};

// DialogFooter has moved into `CoachingDialogActions.tsx` to support the
// matched-state branch (hide Convert, surface Split via LinkedWorkoutSection)
// and the in-flow Match-to picker. Kept the rest of this file intact.
