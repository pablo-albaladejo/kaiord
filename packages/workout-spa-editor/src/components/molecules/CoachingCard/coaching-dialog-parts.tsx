/**
 * Sub-components for CoachingActivityDialog.
 * Extracted to keep file sizes under the lint limit.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import type { CoachingActivity } from "../../../types/coaching-activity";

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  skipped: "Skipped",
};

export const DialogHeader = ({ activity }: { activity: CoachingActivity }) => (
  <div className="flex items-center justify-between">
    <Dialog.Title className="text-lg font-semibold">
      {activity.title}
    </Dialog.Title>
    <Dialog.Close asChild>
      <button type="button" aria-label="Close" className="p-1">
        <X className="h-4 w-4" />
      </button>
    </Dialog.Close>
  </div>
);

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
  if (activity.description === undefined) {
    return (
      <p
        data-testid="coaching-dialog-description-loading"
        className="text-xs italic text-muted-foreground"
      >
        Loading description…
      </p>
    );
  }
  if (!activity.description) return null;
  return (
    <div className="whitespace-pre-line border-t pt-3 text-sm">
      {activity.description}
    </div>
  );
};

export const DialogFooter = ({
  converting,
  onClose,
  onConvert,
}: {
  converting: boolean;
  onClose: () => void;
  onConvert: () => void;
}) => (
  <div className="flex justify-end gap-2 pt-3">
    <button
      type="button"
      onClick={onClose}
      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      Close
    </button>
    <button
      type="button"
      disabled={converting}
      onClick={onConvert}
      className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
    >
      {converting ? "Converting…" : "Convert to workout"}
    </button>
  </div>
);
