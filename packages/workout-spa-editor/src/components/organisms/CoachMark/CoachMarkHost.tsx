/**
 * Mounts the one relevant coach mark, anchored to the element it teaches
 * about. Renders nothing at all when no mark is relevant, when the anchor is
 * not in the focus registry, or before the bubble has been measured — the
 * mark never falls back to a centred position.
 *
 * Must live inside `FocusRegistryProvider`: the anchor is resolved by item id,
 * not by a CSS selector.
 */

import { useState } from "react";
import { createPortal } from "react-dom";

import { useAnchoredPosition } from "../../../hooks/coach-marks/use-anchored-position";
import { useCoachMark } from "../../../hooks/coach-marks/use-coach-mark";
import { useElementHighlight } from "../../../hooks/coach-marks/use-element-highlight";
import { useTranslate } from "../../../i18n/use-translate";
import { CoachMarkCard } from "../../molecules/CoachMark/CoachMarkCard";

export function CoachMarkHost() {
  const t = useTranslate("coach");
  const { mark, accept, dismiss } = useCoachMark();
  const [bubble, setBubble] = useState<HTMLDivElement | null>(null);
  const anchor = useElementHighlight(mark !== null, mark?.anchorId);
  const position = useAnchoredPosition(
    anchor,
    bubble,
    mark?.side ?? "right",
    mark?.align ?? "start"
  );

  if (!mark || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={setBubble}
      role="dialog"
      aria-label={t("a11y.coachMark")}
      data-testid={`coach-mark-${mark.id}`}
      data-anchored={position ? "true" : "false"}
      style={{
        position: "absolute",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        // Hidden, not unmounted: the bubble must be in the DOM for
        // `useAnchoredPosition` to measure the rect it needs to place it.
        visibility: position ? "visible" : "hidden",
        zIndex: 40,
      }}
    >
      <CoachMarkCard markId={mark.id} onAccept={accept} onDismiss={dismiss} />
    </div>,
    document.body
  );
}
