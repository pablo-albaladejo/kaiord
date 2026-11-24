import { useCapabilities } from "../../../contexts/capabilities-context";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import { isSettingsTab, retiredSectionTarget } from "./settings-tab-views";

const SETTINGS_ROOT = "/settings";

export type SettingsSectionResolution =
  | { kind: "open"; open: SettingsTab | undefined }
  | { kind: "redirect"; to: string; replace: boolean }
  | { kind: "wait" };

/**
 * Which panel a `/settings/:section` path opens. A retired section moves to
 * where it lives now; an unknown one, or one an off Capability owns, goes to
 * the index. While the athlete's decisions load, a section a Capability owns
 * waits rather than bouncing a deep link.
 */
export const useSettingsSection = (
  section: string | undefined,
  search: string
): SettingsSectionResolution => {
  const capabilities = useCapabilities();
  const retired = retiredSectionTarget(section, search);
  if (retired !== undefined) {
    return { kind: "redirect", to: retired, replace: true };
  }
  if (section === undefined) return { kind: "open", open: undefined };
  const offered = capabilities.offers("settings", section);
  if (!offered && capabilities.status === "loading") return { kind: "wait" };
  return isSettingsTab(section) && offered
    ? { kind: "open", open: section }
    : { kind: "redirect", to: SETTINGS_ROOT, replace: false };
};
