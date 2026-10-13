import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useDiscoverySettled } from "../../../hooks/connections/use-discovery-settled";
import { useTranslate } from "../../../i18n/use-translate";
import { AttentionMark } from "../../atoms/AttentionMark";
import { ExtensionInstallLink } from "./ExtensionInstallLink";

type Props = { sources: readonly ConnectionSource[] };

/**
 * One notice for the whole page when no extension answered. It waits for the
 * discovery window like the summary counters, so an installed extension that
 * has not announced yet never sees a false "not installed".
 */
export function ConnectionsExtensionBanner({ sources }: Props) {
  const t = useTranslate("connections");
  const bridges = sources.filter((source) => source.mechanism === "bridge");
  const detected = bridges.filter((source) => source.bridgeDetected).length;
  const settled = useDiscoverySettled(detected);

  if (bridges.length === 0 || detected > 0 || !settled) return null;

  return (
    <div
      role="status"
      data-testid="connections-extension-banner"
      className="flex gap-3 rounded-2xl border border-edge bg-surface-elevated p-4"
    >
      <AttentionMark className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-ink-strong">
          {t("ext.bannerTitle")}
        </p>
        <p className="text-[12.5px] leading-relaxed text-ink-muted">
          {t("ext.bannerDetail")}
        </p>
        <p className="text-[12.5px]">
          <ExtensionInstallLink />
        </p>
      </div>
    </div>
  );
}
