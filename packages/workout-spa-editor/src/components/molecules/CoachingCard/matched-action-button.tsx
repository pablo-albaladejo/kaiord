import type { ReactNode } from "react";

/** The outlined button of the coaching dialog, without its text size. */
export const OUTLINE_BUTTON =
  "rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800";

/** One outlined action of the matched-workout bar. */
export function MatchedActionButton(props: {
  testId: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={props.testId}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`${OUTLINE_BUTTON} text-sm`}
    >
      {props.children}
    </button>
  );
}
