import type {
  CapabilityDeclaration,
  CapabilitySurfaceKind,
} from "./capability-catalogue";
import { CAPABILITY_CATALOGUE } from "./capability-catalogue";

/** What the athlete chose, per Capability id; absent means never decided. */
export type CapabilityDecisions = Readonly<Record<string, boolean>>;

export type CapabilityInputs = {
  decisions: CapabilityDecisions;
  /** Ids of Capabilities whose `adoptsExistingData` table holds rows. */
  withData: ReadonlySet<string>;
};

/** The one read the App makes before showing any Capability's surface. */
export type ActiveCapabilities = {
  /** The ids that are on, in catalogue order. */
  on: readonly string[];
  isOn: (id: string) => boolean;
  /** False only when an off Capability owns this surface. */
  offers: (kind: CapabilitySurfaceKind, id: string) => boolean;
};

const KIND_KEY = {
  nav: "nav",
  route: "routes",
  settings: "settings",
  command: "commands",
  shortcut: "shortcuts",
  tool: "tools",
} as const satisfies Record<
  CapabilitySurfaceKind,
  keyof CapabilityDeclaration["owns"]
>;

const isActive = (
  capability: CapabilityDeclaration,
  { decisions, withData }: CapabilityInputs
): boolean => {
  const decision = decisions[capability.id];
  if (decision !== undefined) return decision;
  return (
    capability.adoptsExistingData !== undefined && withData.has(capability.id)
  );
};

const ownsRoute = (prefix: string, path: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`);

const owns = (
  capability: CapabilityDeclaration,
  kind: CapabilitySurfaceKind,
  id: string
): boolean => {
  const surfaces = capability.owns[KIND_KEY[kind]];
  return kind === "route"
    ? surfaces.some((prefix) => ownsRoute(prefix, id))
    : surfaces.includes(id);
};

export const resolveCapabilities = (
  inputs: CapabilityInputs,
  catalogue: readonly CapabilityDeclaration[] = CAPABILITY_CATALOGUE
): ActiveCapabilities => {
  const off = catalogue.filter((c) => !isActive(c, inputs));
  const on = catalogue.filter((c) => isActive(c, inputs)).map((c) => c.id);
  return {
    on,
    isOn: (id) => on.includes(id),
    offers: (kind, id) => !off.some((c) => owns(c, kind, id)),
  };
};

/** Every Capability off: what a new athlete, or no athlete, sees. */
export const NO_CAPABILITIES: ActiveCapabilities = resolveCapabilities({
  decisions: {},
  withData: new Set(),
});
