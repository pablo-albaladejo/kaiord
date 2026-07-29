import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";

type Props = { source: ConnectionSource };

/** An unverifiable bridge only ever announced itself; saying it is "detected"
    in the present tense would outlive any evidence for it. */
const bridgeLineKey = (source: ConnectionSource): string => {
  if (!source.bridgeDetected) return "bridgeMissing";
  return source.sessionVerifiable ? "bridgeDetected" : "bridgeAnnounced";
};

/**
 * The browser bridge belongs inside its source's card, not in a separate
 * Extensions list: a bridge is never interesting on its own, only as the
 * reason a source can or cannot deliver.
 */
export function ConnectionBridgeLine({ source }: Props) {
  const t = useTranslate("connections");
  if (source.mechanism !== "bridge") return null;

  const detected = source.bridgeDetected;
  const tone = detected
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-edge bg-ink-strong/5 text-ink-muted";

  return (
    <div
      data-testid={`connection-bridge-${source.id}`}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] ${tone}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${detected ? "bg-emerald-500" : "bg-ink-muted"}`}
      />
      {t(bridgeLineKey(source), { name: source.name })}
    </div>
  );
}
