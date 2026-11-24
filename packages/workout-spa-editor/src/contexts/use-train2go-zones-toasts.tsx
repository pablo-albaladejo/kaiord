/**
 * The Train2Go provider's own toasts: the offer to take Train2Go's numbers
 * instead of the athlete's (one action, ADR 0003), and the notice that part
 * of the App did not load, so nothing was asked of Train2Go, with Reload.
 */
import { useCallback, useMemo } from "react";

import { KEPT_COPY } from "../adapters/train2go/zones-offer-copy";
import type { ZonesOfferKind } from "../adapters/train2go/zones-offer-kind";
import { toastTrain2GoNotLoaded } from "../components/molecules/Train2GoNotLoaded/train2go-not-loaded";
import { useTranslate } from "../i18n/use-translate";
import { useToastContext } from "./ToastContext";

const OFFER_MS = 12_000;

const ACTION =
  "rounded-md bg-white/10 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/20";

export const useTrain2GoZonesToasts = () => {
  const toasts = useToastContext();
  const t = useTranslate("coaching");
  const offerTheirs = useMemo(
    () => (kind: ZonesOfferKind, takeTheirs: () => Promise<void>) => {
      toasts.info(t(KEPT_COPY[kind]), t("zonesSync.keptHint"), {
        duration: OFFER_MS,
        action: (
          <button
            type="button"
            className={ACTION}
            data-testid="zones-use-theirs"
            onClick={() => void takeTheirs()}
          >
            {t("zonesSync.takeTheirs")}
          </button>
        ),
      });
    },
    [toasts, t]
  );
  const showNotLoaded = useCallback(
    (title?: string) => toastTrain2GoNotLoaded(toasts, t, title),
    [toasts, t]
  );
  return { offerTheirs, showNotLoaded };
};
