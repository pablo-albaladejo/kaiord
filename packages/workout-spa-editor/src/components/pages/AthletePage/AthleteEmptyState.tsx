import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

type AthleteEmptyStateProps = {
  onCreate: () => void;
};

/* No active profile yet. Opens the profile-creation surface in place
   (CreateProfileDialog, lifted into AthletePage) rather than navigating
   away — creating the first profile auto-activates it, swapping this page
   to the populated body. */
export function AthleteEmptyState({ onCreate }: AthleteEmptyStateProps) {
  const t = useTranslate("athlete");
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-[15px] text-ink-body">{t("emptyTitle")}</p>
      <Button variant="primary" onClick={onCreate}>
        {t("createProfile")}
      </Button>
    </div>
  );
}
