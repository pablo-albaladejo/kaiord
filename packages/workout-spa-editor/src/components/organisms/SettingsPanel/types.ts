export type SettingsTab = "ai" | "extensions" | "usage" | "privacy";

export type SettingsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
