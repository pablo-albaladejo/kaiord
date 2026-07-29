import { useTranslate } from "../../../i18n/use-translate";
import { AccountMenu } from "./AccountMenu";
import { HeaderNavBar } from "./HeaderNavBar";
import { SourceHealthPill } from "./SourceHealthPill";
import { useHeaderAttention } from "./use-header-attention";

/**
 * One nav row: destinations, then the account cluster.
 *
 * The per-bridge "Garmin: Connected" / "Train2Go: Synced" chips are gone.
 * They were on screen whether or not anything was wrong, which is the same
 * as never reporting anything; the amber pill replaces them by appearing
 * only when a source is actually down.
 *
 * Attention is read once here and handed to both consumers, so the pill and
 * the avatar dot cannot describe two different moments of the same model.
 */
export function StatusHeader() {
  const t = useTranslate("common");
  const attention = useHeaderAttention();

  return (
    <nav
      aria-label={t("a11y.mainNavigation")}
      className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5 text-sm md:gap-x-2 lg:justify-end"
      data-testid="status-header"
    >
      <HeaderNavBar />
      <span
        data-testid="status-header-divider"
        className="hidden h-6 w-px bg-edge-soft md:inline-block"
        aria-hidden="true"
      />
      <SourceHealthPill attention={attention} />
      <AccountMenu attention={attention !== null} />
    </nav>
  );
}
