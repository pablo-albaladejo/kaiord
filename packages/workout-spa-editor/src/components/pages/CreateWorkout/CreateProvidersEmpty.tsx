import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";

/** Empty state shown when no AI provider is configured. */
export function CreateProvidersEmpty() {
  const t = useTranslate("create-workout");
  const [, navigate] = useLocation();

  return (
    <div className="rounded-[16px] border border-dashed border-slate-700 bg-surface-deep p-6 text-center">
      <Icon
        icon={ICON_MAP.sparkle}
        size="md"
        className="mx-auto mb-3 text-sky-400"
      />
      <p className="mb-1 text-[15px] font-semibold text-slate-50">
        {t("providersEmpty.title")}
      </p>
      <p className="mb-4 text-[12.5px] text-slate-500">
        {t("providersEmpty.supports")}
      </p>
      <Button onClick={() => navigate("/settings/ai")}>
        <Icon icon={ICON_MAP.gear} size="sm" color="inherit" />
        {t("providersEmpty.openSettings")}
      </Button>
    </div>
  );
}
