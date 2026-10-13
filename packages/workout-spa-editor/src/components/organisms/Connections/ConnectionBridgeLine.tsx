import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";
import { ExtensionInstallLink } from "./ExtensionInstallLink";

type Props = { source: ConnectionSource };

/** An unverifiable extension only ever announced itself; saying it is
    "detected" in the present tense would outlive any evidence for it. */
const detectedKey = (source: ConnectionSource): string =>
  source.sessionVerifiable ? "bridgeDetected" : "bridgeAnnounced";

/**
 * The Kaiord extension belongs inside its source's card, not in a separate
 * Extensions list: it is never interesting on its own, only as the reason a
 * source can or cannot deliver.
 */
export function ConnectionBridgeLine({ source }: Props) {
  const t = useTranslate("connections");
  if (source.mechanism !== "bridge") return null;

  const detected = source.bridgeDetected;
  // A working extension is not news, so it gets no colour of its own
  // (principle 2). Detected and missing differ by ink level and the sentence.
  const tone = detected ? "text-ink-body" : "text-ink-muted";

  return (
    <div
      data-testid={`connection-bridge-${source.id}`}
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-edge-soft bg-surface-elevated px-3 py-2 text-[12px] ${tone}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${detected ? "bg-ink-body" : "bg-ink-muted"}`}
      />
      {detected
        ? t(detectedKey(source), { name: source.name })
        : t("ext.requires")}
      {!detected && <ExtensionInstallLink />}
    </div>
  );
}
