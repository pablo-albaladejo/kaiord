import { existsSync } from "node:fs";

/**
 * Where Claude Code reads enterprise managed settings, per platform: the
 * file and the `managed-settings.d/` drop-in directory beside it, and on
 * macOS the MDM managed-preferences plist. Windows registry policy
 * (`HKLM`/`HKCU\\SOFTWARE\\Policies\\ClaudeCode`) and server-managed org
 * settings are out of reach: no `reg.exe`, no network, nothing read.
 */
const MANAGED_SETTINGS: Readonly<Record<string, ReadonlyArray<string>>> = {
  darwin: [
    "/Library/Application Support/ClaudeCode/managed-settings.json",
    "/Library/Application Support/ClaudeCode/managed-settings.d",
    // MDM policy, which outranks the files. The docs name the managed
    // preferences domain `com.anthropic.claudecode` but not a path; this is
    // the standard location of MDM-delivered preferences for a domain.
    "/Library/Managed Preferences/com.anthropic.claudecode.plist",
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
