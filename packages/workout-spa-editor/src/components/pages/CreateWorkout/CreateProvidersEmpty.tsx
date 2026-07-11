import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";

/** Empty state shown when no AI provider is configured. */
export function CreateProvidersEmpty() {
  const t = useTranslate("create-workout");
  const [, navigate] = useLocation();

  return (
    <div className="rounded-[16px] border border-dashed border-edge bg-surface-deep p-6 text-center">
      <Icon
        icon={ICON_MAP.sparkle}
        size="md"
        className="mx-auto mb-3 text-accent"
      />
      <p className="mb-1 text-[15px] font-semibold text-ink-strong">
        {t("providersEmpty.title")}
      </p>
      <p className="mb-4 text-[12.5px] text-ink-muted">
        {t("providersEmpty.supports")}
      </p>
      <Button onClick={() => navigate("/settings/ai")}>
        <Icon icon={ICON_MAP.gear} size="sm" color="inherit" />
        {t("providersEmpty.openSettings")}
      </Button>
    </div>
  );
}
