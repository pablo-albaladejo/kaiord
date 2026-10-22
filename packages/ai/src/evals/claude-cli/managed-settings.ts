import { existsSync } from "node:fs";

/**
 * Where Claude Code reads enterprise managed settings, per platform: the
 * file and the `managed-settings.d/` drop-in directory beside it.
 */
const MANAGED_SETTINGS: Readonly<Record<string, ReadonlyArray<string>>> = {
  darwin: [
    "/Library/Application Support/ClaudeCode/managed-settings.json",
    "/Library/Application Support/ClaudeCode/managed-settings.d",
  ],
  linux: [
    "/etc/claude-code/managed-settings.json",
    "/etc/claude-code/managed-settings.d",
  ],
  win32: [
    "C:\\Program Files\\ClaudeCode\\managed-settings.json",
    "C:\\Program Files\\ClaudeCode\\managed-settings.d",
  ],
};

/**
 * The managed-settings paths that exist, checked by existence only: none is
 * opened or listed, so nothing they hold is read. Managed settings apply
 * whatever the `--setting-sources` flag says and could set
 * `ANTHROPIC_BASE_URL`.
 */
export const managedSettingsPaths = (
  platform: string = process.platform,
  exists: (path: string) => boolean = existsSync
): Array<string> => (MANAGED_SETTINGS[platform] ?? []).filter(exists);
