import { useSearch } from "wouter";

import { contextDefaultDate } from "../../../utils/context-default-date";
import { useLibraryShortCircuitDate } from "../use-library-short-circuit";

export type TemplatePicker = {
  /** True when the library was opened from the "New session" sheet. */
  picking: boolean;
  /** The sheet's day, when it named a valid one. */
  date: string | null;
  /** What a schedule prompt proposes: the sheet's day, or its week's. */
  defaultDate: string;
  /** Where a loaded template opens: the scratch editor, on the sheet's day. */
  loadHref: string;
};

export function useTemplatePicker(): TemplatePicker {
  const params = new URLSearchParams(useSearch());
  const date = useLibraryShortCircuitDate();
  return {
    picking: params.get("source") === "template-picker",
    date,
    defaultDate: date ?? contextDefaultDate(params.get("week")),
    loadHref: `/workout/new?source=scratch${date ? `&date=${date}` : ""}`,
  };
}
