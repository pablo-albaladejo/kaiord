/**
 * Coach notes, clamped to two lines with a Show all / Show less toggle. The
 * toggle appears only when the clamp actually hides text: it is measured
 * from the rendered box (scrollHeight past clientHeight), not guessed from
 * the character count, so a one-line note never offers to expand.
 */
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";

export function ClampedNotes({ children }: { children: ReactNode }) {
  const t = useTranslate("coaching");
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight);
  }, [children, expanded]);
  return (
    <div className="border-t border-edge pt-3">
      <div
        ref={ref}
        id="coaching-dialog-notes"
        data-testid="coaching-dialog-notes"
        className={`space-y-2 text-sm leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
      >
        {children}
      </div>
      {overflows || expanded ? (
        <button
          type="button"
          data-testid="coaching-dialog-notes-toggle"
          aria-expanded={expanded}
          aria-controls="coaching-dialog-notes"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-ink-strong underline-offset-2 hover:underline"
        >
          {expanded ? t("dialog.showLess") : t("dialog.showAll")}
        </button>
      ) : null}
    </div>
  );
}
