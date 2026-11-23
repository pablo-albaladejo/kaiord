/**
 * What `check-capability-surfaces.mjs` holds the Kaiord App to. Paths are
 * relative to `packages/workout-spa-editor/src/`. The Capabilities themselves
 * (their ids, routes and settings sections) are read from the catalogue the
 * App runs on, never restated here; the modules of their screens live here,
 * because only this guard reads them and the App's first load need not.
 */

/** The catalogue: the only file that may spell a Capability's route. */
export const CATALOGUE = "lib/capabilities/capability-catalogue.ts";

/** Where a settings section lives: `${SETTINGS_PATH}/<key>`. */
export const SETTINGS_PATH = "/settings";

/**
 * The source files (a trailing `/` for a folder) that make up each
 * Capability's screens, by catalogue id. Every Capability has an entry, and
 * every entry names a Capability.
 */
export const MODULES = {
  templates: [
    "components/pages/LibraryPage.tsx",
    "components/pages/Library/",
    "components/pages/use-library-schedule.ts",
    "components/pages/use-picker-schedule.ts",
    "components/pages/use-library-short-circuit.ts",
    "components/pages/use-schedule-template.ts",
    "components/molecules/LibraryCard/",
    "components/molecules/SaveToLibraryButton/",
    "hooks/use-library-templates-live.ts",
  ],
  "authority-matrix": [
    "components/organisms/AuthorityMatrix/",
    "hooks/connections/use-authority-choice-editor.ts",
  ],
};

/** A value import of one of these is going through the read API. */
export const READ_API = [
  "contexts/capabilities-context.tsx",
  "components/atoms/CapabilityGate/CapabilityGate.tsx",
  "lib/capabilities/resolve-capabilities.ts",
  "hooks/use-offered-nav-destinations.ts",
];

/**
 * The athlete's Capability decisions: every file that reads them resolves
 * them through the read API, except the store's own plumbing.
 */
export const DECISIONS = {
  store: "capabilityDecisions",
  storage: {
    "adapters/dexie/dexie-capability-decision-repository.ts":
      "the store's own repository: it returns rows, it decides nothing",
    "adapters/dexie/dexie-v40-migration.ts":
      "moves the decisions off the preferences row, once",
  },
};

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
    name: "the assistant's Tools",
    symbol: "buildChatTools",
    definedIn: ["application/chat/tools/build-chat-tools.ts"],
    readers: [
      {
        file: "hooks/chat/build-chat-agent.ts",
        askedBy: "hooks/chat/use-chat-turn-ctx.ts",
        reason:
          "builds the Tools outside React; the turn's hook asks and hands it `offers`",
      },
    ],
  },
  {
    name: "what the assistant can do",
    symbol: "chatCapabilitySections",
    definedIn: ["application/chat/chat-capabilities.ts"],
    readers: ["components/organisms/Chat/ChatCapabilities.tsx"],
  },
];
