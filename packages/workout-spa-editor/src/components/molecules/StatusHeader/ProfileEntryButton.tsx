import { User } from "lucide-react";
import { useLocation } from "wouter";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";

export function ProfileEntryButton() {
  const [, navigate] = useLocation();
  const t = useTranslate("common");
  const activeProfile = useActiveProfileLive()?.profile ?? null;
  const label = activeProfile?.name ?? t("status.noProfile");

  const ariaLabel = activeProfile
    ? t("a11y.openAthleteProfile", { name: activeProfile.name })
    : t("a11y.openAthleteProfileEmpty");

  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={() => navigate("/athlete")}
      aria-label={ariaLabel}
      data-testid="status-header-profile-button"
    >
      <User className="h-4 w-4" />
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}
