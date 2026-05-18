import { HelpCircle, Plus, Settings, User } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "../../atoms/Button/Button";

type StatusEntryButtonsProps = {
  onHelpClick: () => void;
};

export function StatusEntryButtons({ onHelpClick }: StatusEntryButtonsProps) {
  const [, navigate] = useLocation();
  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate("/workout/new")}
        data-testid="status-header-new-button"
      >
        <Plus className="h-4 w-4" />
        New workout
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => navigate("/settings/profile")}
        aria-label="Open profile manager"
        data-testid="status-header-profile-button"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Profile</span>
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        onClick={onHelpClick}
        aria-label="Open help"
        title="Help (?)"
        data-testid="status-header-help-button"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Help</span>
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => navigate("/settings/ai")}
        aria-label="Open settings"
        data-testid="status-header-settings-button"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Settings</span>
      </Button>
    </>
  );
}
