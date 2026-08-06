import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import type { BackOrigin } from "../../../routing/back-origin";
import { withOrigin } from "../../../routing/with-origin";
import { Button } from "../../atoms/Button/Button";
import { ICON_MAP } from "../../atoms/Icon/icon-map";

export type CreateWorkoutCtaProps = {
  /** Which route's action row hosts this CTA — becomes the editor's `from`. */
  origin: BackOrigin;
  /** Present on the calendar so closing the editor returns to this week. */
  week?: string;
};

/**
 * The create-workout CTA each route renders in its own action row — the
 * `page`-surface destination from the nav registry. Hidden below `md`, where
 * the floating create FAB already covers the destination.
 */
export function CreateWorkoutCta({ origin, week }: CreateWorkoutCtaProps) {
  const t = useTranslate("nav");
  const [, navigate] = useLocation();
  const PlusIcon = ICON_MAP.plus;
  return (
    <Button
      variant="cta"
      size="sm"
      className="hidden md:inline-flex"
      data-testid="create-workout-cta"
      onClick={() =>
        navigate(withOrigin("/workout/new", origin, week ? { week } : {}))
      }
    >
      <PlusIcon className="h-4 w-4" />
      <span>{t("new")}</span>
    </Button>
  );
}
