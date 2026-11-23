import { KEPT_ON_DEVICE } from "../../../application/data-flows/kept-on-device";
import { useTranslate } from "../../../i18n/use-translate";

/** What the App keeps about the athlete that never leaves this device. */
export const KeptOnDevice = () => {
  const t = useTranslate("dataFlows");
  return (
    <div className="mb-4" data-testid="kept-on-device">
      <h4 className="mb-2 text-xs font-semibold uppercase text-ink-muted">
        {t("kept.title")}
      </h4>
      <ul className="space-y-2">
        {KEPT_ON_DEVICE.map((id) => (
          <li key={id} className="rounded-lg border border-edge p-3 text-sm">
            {t(`kept.${id}`)}
          </li>
        ))}
      </ul>
    </div>
  );
};
