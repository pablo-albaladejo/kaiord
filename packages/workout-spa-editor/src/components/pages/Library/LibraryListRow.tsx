import { Play } from "lucide-react";

import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { reviewCopyFor } from "../../../lib/workout-review";
import type { Profile } from "../../../types/profile";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { LibraryCard } from "../../molecules/LibraryCard";
import { buildLibraryCardModel } from "./library-card-model";

export type LibraryListRowProps = {
  template: WorkoutTemplate;
  profile: Profile | null;
  hasCurrentWorkout: boolean;
  onLoad: () => void;
  onSchedule: () => void;
  onDelete: () => void;
};

export function LibraryListRow({
  template,
  profile,
  hasCurrentWorkout,
  onLoad,
  onSchedule,
  onDelete,
}: LibraryListRowProps) {
  const t = useTranslate("library");
  const locale = useActiveLocale();
  const model = buildLibraryCardModel(
    template,
    profile,
    t,
    reviewCopyFor(locale)
  );

  return (
    <div className="space-y-2">
      <LibraryCard {...model} onClick={onLoad} />
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={onSchedule}
        >
          <Icon icon={ICON_MAP.calendar} size="sm" color="inherit" />
          {t("card.schedule")}
        </Button>
        {hasCurrentWorkout && (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onLoad}
            aria-label={t("card.loadAria", { name: template.name })}
            data-testid="card-load-into-editor"
          >
            <Play className="h-4 w-4" />
            {t("card.load")}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label={t("card.deleteAria", { name: template.name })}
        >
          <Icon icon={ICON_MAP.x} size="sm" color="inherit" />
        </Button>
      </div>
    </div>
  );
}
