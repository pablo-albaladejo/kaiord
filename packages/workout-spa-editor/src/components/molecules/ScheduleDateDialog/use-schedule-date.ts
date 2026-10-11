import { useEffect, useState } from "react";

import { isValidCalendarDate } from "../../../utils/is-valid-calendar-date";
import { todayIsoDate } from "../../../utils/today-iso-date";

/**
 * Date state for `ScheduleDateDialog`: every open proposes `defaultDate`
 * (today without one), and confirming an empty or impossible date flags
 * the field instead of calling `onConfirm`.
 */
export function useScheduleDate(
  open: boolean,
  defaultDate: string | undefined,
  onConfirm: (date: string) => void
) {
  const proposed = defaultDate ?? todayIsoDate();
  const [date, setDate] = useState(proposed);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(proposed);
    setInvalid(false);
  }, [open, proposed]);

  const change = (value: string) => {
    setDate(value);
    setInvalid(false);
  };
  const confirm = () => {
    if (!isValidCalendarDate(date)) return setInvalid(true);
    onConfirm(date);
  };

  return { date, invalid, change, confirm };
}
