/**
 * Shared renderer for a single coaching inline node (text / strong /
 * link). Used by the editor coach sidebar, the coaching activity
 * dialog, and the day-comments panel so linkification behaves
 * identically everywhere — no `dangerouslySetInnerHTML`.
 *
 * `link` inlines are already https-only (validated in
 * `format-coaching-description`); the full href is mirrored into the
 * anchor `title` so a spoofed label (e.g. text "dropbox.com" pointing
 * elsewhere) reveals its real destination on hover/long-press.
 */
import type { ReactNode } from "react";

import type { DescriptionInline } from "./format-coaching-description";

const LINK_CLASS =
  "text-sky-600 underline underline-offset-2 hover:text-sky-500 dark:text-sky-400 break-words";

export function renderCoachingInline(
  inline: DescriptionInline,
  key: number,
  leadingSpace = false
): ReactNode {
  const prefix = leadingSpace && key > 0 ? " " : "";
  if (inline.kind === "strong") {
    return <strong key={key}>{inline.value}</strong>;
  }
  if (inline.kind === "link") {
    return (
      <a
        key={key}
        href={inline.href}
        target="_blank"
        rel="noopener noreferrer"
        title={inline.href}
        className={LINK_CLASS}
      >
        {prefix}
        {inline.label}
      </a>
    );
  }
  return (
    <span key={key}>
      {prefix}
      {inline.value}
    </span>
  );
}
