import { User } from "lucide-react";
import { useLocation } from "wouter";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { Button } from "../../atoms/Button/Button";

export function ProfileEntryButton() {
  const [, navigate] = useLocation();
  const activeProfile = useActiveProfileLive()?.profile ?? null;
  const label = activeProfile?.name ?? "No profile";

  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={() => navigate("/settings/profile")}
      aria-label="Open profile manager"
      data-testid="status-header-profile-button"
    >
      <User className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
