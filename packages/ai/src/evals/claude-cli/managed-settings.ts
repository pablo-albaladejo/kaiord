import { existsSync } from "node:fs";

/** Where Claude Code reads enterprise managed settings, per platform. */
const MANAGED_SETTINGS: Readonly<Record<string, string>> = {
  darwin: "/Library/Application Support/ClaudeCode/managed-settings.json",
  linux: "/etc/claude-code/managed-settings.json",
  win32: "C:\\Program Files\\ClaudeCode\\managed-settings.json",
};

/**
 * Whether a managed-settings file exists, checked by existence only: it is
 * never opened, so nothing it holds is read. Such a file applies whatever the
 * `--setting-sources` flag says and could set `ANTHROPIC_BASE_URL`.
 */
export const managedSettingsFile = (
  platform: string = process.platform,
  exists: (path: string) => boolean = existsSync
): string | null => {
  const path = MANAGED_SETTINGS[platform];
  return path !== undefined && exists(path) ? path : null;
};
