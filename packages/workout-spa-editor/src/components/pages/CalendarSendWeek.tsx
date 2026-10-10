/**
 * The "Send week" button for the nav row and its panel, both driven by one
 * `useCalendarSendWeek`. The button hides while a run is shown.
 */
import { useTranslate } from "../../i18n/use-translate";
import { Button } from "../atoms/Button";
import { SendWeekPanel } from "../organisms/SendWeekPanel/SendWeekPanel";
import type { useCalendarSendWeek } from "./use-calendar-send-week";

type SendWeek = ReturnType<typeof useCalendarSendWeek>;

export function SendWeekButton({ send }: { send: SendWeek }) {
  const t = useTranslate("calendar");
  if (!send.offered || send.state.phase !== "idle") return null;
  return (
    <Button size="sm" variant="secondary" onClick={send.startWeek}>
      {t("sendWeek.action")}
    </Button>
  );
}

export function SendWeekSection({
  send,
  weekId,
}: {
  send: SendWeek;
  weekId: string;
}) {
  if (send.state.phase === "idle") return null;
  return (
    <SendWeekPanel
      state={send.state}
      weekId={weekId}
      features={send.features}
      onCancel={send.cancel}
      onRetry={send.retry}
      onClose={send.close}
    />
  );
}
