/**
 * Card Schedule Action
 *
 * Schedule button for library page workout cards.
 */

import { CalendarPlus } from "lucide-react";

import { Button } from "../../../atoms/Button/Button";

type CardScheduleActionProps = {
  onSchedule: () => void;
};

export function CardScheduleAction({ onSchedule }: CardScheduleActionProps) {
  return (
    <Button
      onClick={onSchedule}
      variant="secondary"
      className="flex-1"
      size="sm"
    >
      <CalendarPlus className="mr-2 h-4 w-4" />
      Schedule
    </Button>
  );
}
