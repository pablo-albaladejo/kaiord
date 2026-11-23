import { useToastContext } from "../../../contexts/ToastContext";
import { useZonesOffer } from "../../../hooks/athlete/use-zones-offer";
import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { logger } from "../../../utils/logger";

const BUTTON =
  "rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

type ZonesOfferRowProps = { profile: Profile };

/* The Train2Go offer once its notice is gone: it stays here, on this device,
   until the athlete uses Train2Go's numbers or keeps theirs. */
export function ZonesOfferRow({ profile }: ZonesOfferRowProps) {
  const t = useTranslate("coaching");
  const toasts = useToastContext();
  const { kind, take, keep } = useZonesOffer(profile);
  if (!kind) return null;
  const kept = {
    thresholds: t("zonesSync.kept.thresholds"),
    zones: t("zonesSync.kept.zones"),
    both: t("zonesSync.kept.both"),
  }[kind];
  const announceTaken = {
    thresholds: () => toasts.success(t("zonesSync.taken.thresholds")),
    zones: () => toasts.success(t("zonesSync.taken.zones")),
    both: () => toasts.success(t("zonesSync.taken.both")),
  }[kind];

  const handleUse = () => {
    void take()
      .then((taken) => {
        if (taken) announceTaken();
        else toasts.error(t("zonesSync.notSynced"));
      })
      .catch((error: unknown) => {
        logger.warn("Failed to take Train2Go's zones", { error });
      });
  };

  return (
    <div
      data-testid="athlete-zones-offer"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-surface-elevated px-3.5 py-3"
    >
      <span className="min-w-0 flex-1 basis-[200px] text-[13px] font-medium text-ink-strong">
        {kept}
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleUse}
          className={`${BUTTON} bg-accent text-surface hover:bg-accent/90`}
        >
          {t("zonesSync.takeTheirs")}
        </button>
        <button
          type="button"
          onClick={keep}
          className={`${BUTTON} border border-edge bg-transparent text-ink-body hover:text-ink-strong`}
        >
          {t("zonesSync.keepYours")}
        </button>
      </div>
    </div>
  );
}
