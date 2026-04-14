export type SettingsTab = "ai" | "extensions" | "privacy";

export type SettingsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
