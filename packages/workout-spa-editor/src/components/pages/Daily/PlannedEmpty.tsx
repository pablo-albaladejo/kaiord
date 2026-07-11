import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { withOrigin } from "../../../routing/with-origin";
import { Button } from "../../atoms/Button";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export function PlannedEmpty() {
  const t = useTranslate("daily");
  const [, navigate] = useLocation();

  return (
    <Card className="bg-surface border-edge p-6 text-center">
      <p className="text-[15px] font-semibold text-ink-body m-0">
        {t("planned.emptyTitle")}
      </p>
      <p className="text-[13px] text-ink-muted m-0 mt-1">
        {t("planned.emptyBody")}
      </p>
      <Button
        variant="primary"
        className="mt-4"
        onClick={() => navigate(withOrigin("/workout/new", "daily"))}
      >
        <Icon icon={ICON_MAP.plus} size="sm" color="inherit" />
        {t("planned.planSession")}
      </Button>
    </Card>
  );
}
