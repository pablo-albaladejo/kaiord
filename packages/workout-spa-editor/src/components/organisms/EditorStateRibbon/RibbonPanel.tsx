import type { ReactNode } from "react";

import { Button } from "../../atoms/Button/Button";
import type { RibbonContent } from "./ribbon-content";

type RibbonPanelProps = {
  content: RibbonContent;
  headline: string;
  detail: string;
  fixLabel?: string;
  onFix?: () => void;
  /** The single send control, supplied by the ribbon. */
  action?: ReactNode;
  regionLabel: string;
};

const TONE_CLASSES: Record<RibbonContent["tone"], string> = {
  attention: "bg-surface-elevated border-edge",
  quiet: "bg-surface-page border-edge-soft",
};

export function RibbonPanel({
  content,
  headline,
  detail,
  fixLabel,
  onFix,
  action,
  regionLabel,
}: RibbonPanelProps) {
  return (
    <div
      role="status"
      aria-label={regionLabel}
      data-testid="editor-state-ribbon"
      data-gate-tone={content.tone}
      className={`flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3.5 ${TONE_CLASSES[content.tone]}`}
    >
      <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1">
        <p className="m-0 text-[13px] font-semibold text-ink-strong">
          {headline}
        </p>
        <p className="m-0 text-[12.5px] leading-relaxed text-ink-muted text-pretty">
          {detail}
        </p>
      </div>
      <div className="flex flex-none flex-wrap items-center gap-2">
        {action}
        {fixLabel && (
          <Button variant="secondary" size="sm" onClick={onFix}>
            {fixLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
