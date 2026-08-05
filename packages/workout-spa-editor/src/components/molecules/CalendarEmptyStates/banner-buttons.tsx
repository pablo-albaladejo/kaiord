/** The two button skins the calendar banners share: the fix, and the rest. */
import type { MouseEventHandler, ReactNode } from "react";

const BASE = "rounded-lg px-3.5 py-2 text-[13px] font-medium";

export const PRIMARY = `${BASE} bg-accent text-surface hover:opacity-90`;
const SECONDARY = `${BASE} border border-edge text-ink-body hover:border-edge-strong hover:text-ink-strong`;

export type BannerButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  primary?: boolean;
  testId?: string;
  children: ReactNode;
};

export function BannerButton({
  onClick,
  primary = false,
  testId,
  children,
}: BannerButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={primary ? PRIMARY : SECONDARY}
    >
      {children}
    </button>
  );
}
