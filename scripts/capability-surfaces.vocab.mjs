/**
 * What `check-capability-surfaces.mjs` holds the Kaiord App to. Paths are
 * relative to `packages/workout-spa-editor/src/`. The Capabilities themselves
 * (their routes and the modules of their screens) are read from the catalogue
 * the App runs on, never restated here.
 */

/** The catalogue: the only file that may spell a Capability's route. */
export const CATALOGUE = "lib/capabilities/capability-catalogue.ts";

/** Importing one of these is going through the read API. */
export const READ_API = [
  "contexts/capabilities-context.tsx",
  "components/atoms/CapabilityGate/CapabilityGate.tsx",
  "lib/capabilities/resolve-capabilities.ts",
  "hooks/use-offered-nav-destinations.ts",
];

/**
 * The lazy route table imports every page, a Capability's too; it is safe
 * only because the route switch is mounted inside `CapabilityRouteGate`.
 */
export const ROUTE_TABLE = {
  file: "lazy-pages.ts",
  mountedBy: "App.tsx",
  gate: "CapabilityRouteGate",
};

/**
 * Each registry lists surfaces a Capability may own. Its `symbol` may be
 * named only where it is defined, by its gate `readers` (each of which must
 * import the read API), and by `lookups`: files that only read the entry of
 * an id the caller already holds, after the gate filtered it.
 */
export const REGISTRIES = [
  {
    name: "navigation destinations",
    symbol: "NAV_DESTINATIONS",
    definedIn: ["routing/nav-destinations.ts"],
    readers: ["hooks/use-offered-nav-destinations.ts"],
  },
  {
    name: "settings sections",
    symbol: "SETTINGS_PAGE_ROWS",
    definedIn: [
      "components/pages/SettingsPage/settings-groups.ts",
      "components/pages/SettingsPage/settings-tab-views.tsx",
    ],
    readers: ["components/pages/SettingsPage/SettingsGroupList.tsx"],
  },
  {
    name: "settings rail",
    symbol: "SETTINGS_TAB_ORDER",
    definedIn: ["components/pages/SettingsPage/settings-tab-views.tsx"],
    readers: ["components/pages/SettingsPage/SettingsSectionRail.tsx"],
  },
  {
    name: "editor commands (palette, context menu, coach marks)",
    symbol: "buildDoCommands",
    definedIn: ["hooks/build-do-commands.ts"],
    readers: ["hooks/use-editor-commands.ts"],
  },
  {
    name: "keyboard shortcuts",
    symbol: "SHORTCUT_CATALOG",
    definedIn: ["constants/shortcut-catalog.ts"],
    readers: [
      "components/organisms/ShortcutSheet/ShortcutSheetGroup.tsx",
      "hooks/offered-shortcut-handlers.ts",
    ],
    lookups: {
      "utils/shortcut-key.ts": "the keys of one row, by an id the caller holds",
      "components/molecules/CoachMark/CoachMarkCard.tsx":
        "the keys of the command a gated mark offers",
      "components/organisms/CommandPalette/CommandPaletteRow.tsx":
        "the keys of a gated command row",
    },
  },
  {
    name: "the assistant's Tools",
    symbol: "buildChatTools",
    definedIn: ["application/chat/tools/build-chat-tools.ts"],
    readers: ["hooks/chat/build-chat-agent.ts"],
  },
  {
    name: "what the assistant can do",
    symbol: "chatCapabilitySections",
    definedIn: ["application/chat/chat-capabilities.ts"],
    readers: ["components/organisms/Chat/ChatCapabilities.tsx"],
  },
];
