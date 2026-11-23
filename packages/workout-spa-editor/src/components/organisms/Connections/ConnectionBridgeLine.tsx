import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";

type Props = { source: ConnectionSource };

/** An unverifiable extension only ever announced itself; saying it is
    "detected" in the present tense would outlive any evidence for it. */
const detectedKey = (source: ConnectionSource): string =>
  source.sessionVerifiable ? "bridgeDetected" : "bridgeAnnounced";

/**
 * The extension belongs inside its source's card, not in a separate
 * Extensions list: it is never interesting on its own, only as the reason a
 * source can or cannot deliver. A missing one is not this line's to say: the
 * card's Install notice says it, once, with its fix.
 */
export function ConnectionBridgeLine({ source }: Props) {
  const t = useTranslate("connections");
  if (source.mechanism !== "bridge" || !source.bridgeDetected) return null;

  // A working extension is not news, so it gets no colour of its own
  // (principle 2).
  return (
    <div
      data-testid={`connection-bridge-${source.id}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-edge-soft bg-surface-elevated px-3 py-2 text-[12px] text-ink-body"
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-body"
      />
      {t(detectedKey(source), { name: source.name })}
    </div>
  );
}
