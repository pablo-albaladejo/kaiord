import { useTranslate } from "../../i18n/use-translate";
import { Button } from "../atoms/Button";

/** Reloads the App, so a part of it that did not load is fetched again. */
export const ReloadAppButton: React.FC = () => {
  const t = useTranslate("workout-detail");
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => window.location.reload()}
      data-testid="reload-app-button"
    >
      {t("placement.reload")}
    </Button>
  );
};
