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
import { DialogDescriptionError } from "./coaching-dialog-description-error";
import { ClampedNotes } from "./coaching-dialog-notes";
import type { DescriptionLoad } from "./use-coaching-dialog-helpers";

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

export const DialogDescription = ({
  activity,
  load,
}: {
  activity: CoachingActivity;
  load: DescriptionLoad;
}) => {
  const t = useTranslate("coaching");
  if (activity.description === undefined) {
    if (load.reason)
      return (
        <DialogDescriptionError reason={load.reason} onRetry={load.retry} />
      );
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
    <ClampedNotes>
      {paragraphs.map((p, pi) => (
        <p key={pi}>
          {p.inlines.map((inline, ii) =>
            renderCoachingInline(inline, ii, true)
          )}
        </p>
      ))}
    </ClampedNotes>
  );
};

// DialogFooter has moved into `CoachingDialogActions.tsx` to support the
// matched-state branch (hide Convert, surface Split via LinkedWorkoutSection)
// and the in-flow Match-to picker. Kept the rest of this file intact.
