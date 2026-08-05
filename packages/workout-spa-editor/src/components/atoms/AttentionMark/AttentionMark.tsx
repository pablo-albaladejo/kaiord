import { TriangleAlert } from "lucide-react";
import type { HTMLAttributes } from "react";

import { Icon, type IconSize } from "../Icon";

export type AttentionMarkProps = HTMLAttributes<HTMLSpanElement> & {
  size?: Extract<IconSize, "xs" | "sm">;
};

/* The one mark for "this needs you". Success and warning left the palette, so
   a state that asks something of the reader says so with an icon and a
   sentence rather than with amber — the mark inherits `--text` from its
   wrapper and carries no hue of its own. Always decorative: every call site
   pairs it with the sentence that names the consequence, and the row marker
   adds an `sr-only` label of its own. */
export const AttentionMark = ({
  size = "sm",
  className = "",
  ...props
}: AttentionMarkProps) => (
  <span
    aria-hidden="true"
    className={`flex-none text-ink-strong ${className}`.trim()}
    {...props}
  >
    <Icon icon={TriangleAlert} size={size} color="inherit" />
  </span>
);
