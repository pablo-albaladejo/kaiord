/**
 * Every Capability of the Kaiord App: a part beyond the core path from
 * Coaching Activity to Workout on the watch, off and out of sight until the
 * athlete activates it (GLOSSARY.md, ADR 0003). Adding one is one entry here
 * plus its two strings in `settings.json` (`capabilities.items.<id>`).
 *
 * `owns` names, by the id each registry already uses, every surface the App
 * offers only while the Capability is on. `modules` lists the source files
 * (relative to `src/`, a trailing `/` for a folder) that make up its screens;
 * `scripts/check-capability-surfaces.mjs` fails when anything outside them
 * reaches one without going through the read API (`useCapabilities`).
 */

export type CapabilitySurfaceKind =
  "nav" | "route" | "settings" | "command" | "shortcut" | "tool";

export type CapabilityGrade = "advanced" | "experimental";

export type CapabilityDeclaration = {
  id: string;
  /** Absent for an ordinary Capability; shown next to its name otherwise. */
  grade?: CapabilityGrade;
  owns: {
    /** `NAV_ROWS` ids. */
    nav: readonly string[];
    /** Path prefixes; an off one redirects to the Day. */
    routes: readonly string[];
    /** Settings section keys (`SETTINGS_PAGE_ROWS`). */
    settings: readonly string[];
    /** Editor command ids (`useEditorCommands`). */
    commands: readonly string[];
    /** `SHORTCUT_CATALOG` row ids. */
    shortcuts: readonly string[];
    /** The assistant's Tool names (`buildChatTools`). */
    tools: readonly string[];
  };
  modules: readonly string[];
  /**
   * A Dexie table whose rows mean the athlete already used this part of the
   * App before it became a Capability: with no decision recorded, any row
   * reads as on, so an upgrade never hides data the athlete made.
   */
  adoptsExistingData?: string;
};

export const CAPABILITY_CATALOGUE = [
  {
    id: "templates",
    owns: {
      nav: ["library"],
      routes: ["/library"],
      settings: [],
      commands: [],
      shortcuts: [],
      tools: [],
    },
    modules: [
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
    adoptsExistingData: "templates",
  },
] as const satisfies readonly CapabilityDeclaration[];

export type CapabilityId = (typeof CAPABILITY_CATALOGUE)[number]["id"];

/** Every route path prefix a Capability owns. */
export const CAPABILITY_ROUTES: readonly string[] =
  CAPABILITY_CATALOGUE.flatMap((capability) => capability.owns.routes);

/** The first route a Capability owns: where a link into it points. */
export const capabilityHome = (id: CapabilityId): string =>
  CAPABILITY_CATALOGUE.find((capability) => capability.id === id)?.owns
    .routes[0] ?? "/daily";
