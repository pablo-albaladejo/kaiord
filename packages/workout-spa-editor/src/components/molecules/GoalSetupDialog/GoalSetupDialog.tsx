/**
 * GoalSetupDialog — modal that hosts the energy-goal wizard. Launched from the
 * "Set goal" affordance on the EnergyBalanceCard. Radix `Dialog.Root` is
 * controlled by the parent `useState`; a successful save closes it.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useId } from "react";

import {
  DIALOG_CONTENT_CLASSES,
  DIALOG_OVERLAY_CLASSES,
} from "../../organisms/WorkoutLibrary/constants";
import { GoalSetupForm } from "./GoalSetupForm";

export type GoalSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  today: string;
};

export function GoalSetupDialog({
  open,
  onOpenChange,
  profileId,
  today,
}: GoalSetupDialogProps) {
  const titleId = useId();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={undefined}
          className={DIALOG_CONTENT_CLASSES}
          data-testid="goal-setup-dialog"
        >
          <Dialog.Title
            id={titleId}
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            Set energy goal
          </Dialog.Title>
          <GoalSetupForm
            profileId={profileId}
            today={today}
            onSaved={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
