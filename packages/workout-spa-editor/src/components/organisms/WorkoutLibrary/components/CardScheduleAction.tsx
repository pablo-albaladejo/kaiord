/**
 * Card Schedule Action
 *
 * Schedule button for library page workout cards.
 */

import { CalendarPlus } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import { Button } from "../../../atoms/Button/Button";

type CardScheduleActionProps = {
  onSchedule: () => void;
};

export function CardScheduleAction({ onSchedule }: CardScheduleActionProps) {
  const t = useTranslate("library");
  return (
    <Button
      onClick={onSchedule}
      variant="secondary"
      className="flex-1"
      size="sm"
    >
      <CalendarPlus className="mr-2 h-4 w-4" />
      {t("card.schedule")}
    </Button>
  );
}
