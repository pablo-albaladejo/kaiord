/**
 * Every Capability of the Kaiord App: a part beyond the core path from
 * Coaching Activity to Workout on the watch, off and out of sight until the
 * athlete activates it (GLOSSARY.md, ADR 0003). Adding one is one entry here,
 * its `modules` in `scripts/capability-surfaces.vocab.mjs`, and its two
 * strings in `settings.json` (`capabilities.items.<id>`).
 *
 * `owns` names, by the id each registry already uses, every surface the App
 * offers only while the Capability is on; `inScreen` names the parts of other
 * screens that belong to it (a button, a tile, a setup step, a link), each
 * asked for with `<CapabilityGate surface>` or `offers("inScreen", id)`.
 */

import { DAILY_PATH, SETTINGS_PATH } from "../../routing/constants";

export type CapabilitySurfaceKind =
  "nav" | "route" | "settings" | "tool" | "inScreen";

/** `experimental` is kept for WHOOP (#1664), the one Capability that needs it. */
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
    /** The assistant's Tool names (`buildChatTools`). */
    tools: readonly string[];
    /** Parts of other screens, by an id named here. */
    inScreen: readonly string[];
  };
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
      tools: [],
      inScreen: [
        "workout-save-as-template",
        "ai-result-save-as-template",
        "create-from-template",
        "setup-save-to-library",
      ],
    },
    adoptsExistingData: "templates",
  },
  {
    id: "authority-matrix",
    grade: "advanced",
    owns: {
      nav: [],
      routes: [],
      settings: ["authority"],
      tools: ["set_data_route"],
      inScreen: ["connections-authority-link"],
    },
    adoptsExistingData: "dataTypeSourcePolicy",
  },
] as const satisfies readonly CapabilityDeclaration[];

type Catalogue = (typeof CAPABILITY_CATALOGUE)[number];

export type CapabilityId = Catalogue["id"];

/** A part of another screen a Capability owns: a typo fails typecheck. */
export type InScreenSurfaceId = Catalogue["owns"]["inScreen"][number];

/** Every route path prefix a Capability owns. */
export const CAPABILITY_ROUTES: readonly string[] =
  CAPABILITY_CATALOGUE.flatMap((capability) => capability.owns.routes);

/**
 * Where a link into a Capability points: its first route, else its first
 * settings section, else the Day.
 */
export const capabilityHome = (id: CapabilityId): string => {
  const owns: CapabilityDeclaration["owns"] | undefined =
    CAPABILITY_CATALOGUE.find((capability) => capability.id === id)?.owns;
  if (owns?.routes[0] !== undefined) return owns.routes[0];
  if (owns?.settings[0] !== undefined) {
    return `${SETTINGS_PATH}/${owns.settings[0]}`;
  }
  return DAILY_PATH;
};
