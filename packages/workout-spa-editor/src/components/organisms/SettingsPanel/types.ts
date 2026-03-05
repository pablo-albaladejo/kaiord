export type SettingsTab = "ai" | "garmin" | "privacy";

export type SettingsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
