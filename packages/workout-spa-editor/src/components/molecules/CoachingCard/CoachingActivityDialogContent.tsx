/**
 * Inner JSX for CoachingActivityDialog. Sub-components live in
 * coaching-dialog-parts.tsx so this file (and the function) stay
 * under the lint-enforced limits.
 */

import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMeta,
  STATUS_LABEL,
} from "./coaching-dialog-parts";

export type CoachingActivityDialogContentProps = {
  activity: CoachingActivity;
  error: string | null;
  converting: boolean;
  onClose: () => void;
  onConvert: () => void;
};

export function CoachingActivityDialogContent({
  activity,
  error,
  converting,
  onClose,
  onConvert,
}: CoachingActivityDialogContentProps) {
  return (
    <div className="space-y-3">
      <DialogHeader activity={activity} />
      <DialogMeta activity={activity} />
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">
          {STATUS_LABEL[activity.status] ?? activity.status}
        </span>
      </div>
      <DialogDescription activity={activity} />
      {error && (
        <p data-testid="coaching-dialog-error" className="text-xs text-red-500">
          {error}
        </p>
      )}
      <DialogFooter
        converting={converting}
        onClose={onClose}
        onConvert={onConvert}
      />
    </div>
  );
}
