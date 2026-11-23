import type {
  CapabilityDeclaration,
  CapabilityId,
  CapabilitySurfaceKind,
  InScreenSurfaceId,
} from "./capability-catalogue";
import { CAPABILITY_CATALOGUE } from "./capability-catalogue";
import { isUnderRoute } from "./capability-route-path";

/** What the athlete chose, per Capability id; absent means never decided. */
export type CapabilityDecisions = Readonly<Record<string, boolean>>;

export type CapabilityInputs = {
  decisions: CapabilityDecisions;
  /** Ids of Capabilities whose `adoptsExistingData` table holds rows. */
  withData: ReadonlySet<string>;
};

type SurfaceIdOf<K extends CapabilitySurfaceKind> = K extends "inScreen"
  ? InScreenSurfaceId
  : string;

/** The one read the App makes before showing any Capability's surface. */
export type ActiveCapabilities = {
  /** The ids that are on, in catalogue order. */
  on: readonly CapabilityId[];
  isOn: (id: CapabilityId) => boolean;
  /** False only when an off Capability owns this surface. */
  offers: <K extends CapabilitySurfaceKind>(
    kind: K,
    id: SurfaceIdOf<K>
  ) => boolean;
};

const OWNS_FIELD_OF_KIND = {
  nav: "nav",
  route: "routes",
  settings: "settings",
  tool: "tools",
  inScreen: "inScreen",
} as const satisfies Record<
  CapabilitySurfaceKind,
  keyof CapabilityDeclaration["owns"]
>;

/** The one rule: a recorded decision wins; else its adopted data turns it on. */
export const isCapabilityOn = (
  capability: CapabilityDeclaration,
  { decisions, withData }: CapabilityInputs
): boolean => {
  const decision = decisions[capability.id];
  if (decision !== undefined) return decision;
  return (
    capability.adoptsExistingData !== undefined && withData.has(capability.id)
  );
};

const owns = (
  capability: CapabilityDeclaration,
  kind: CapabilitySurfaceKind,
  id: string
): boolean => {
  const surfaces: readonly string[] = capability.owns[OWNS_FIELD_OF_KIND[kind]];
  return kind === "route"
    ? surfaces.some((prefix) => isUnderRoute(prefix, id))
    : surfaces.includes(id);
};

export const resolveCapabilities = (
  inputs: CapabilityInputs,
  catalogue: readonly CapabilityDeclaration[] = CAPABILITY_CATALOGUE
): ActiveCapabilities => {
  const off = catalogue.filter((c) => !isCapabilityOn(c, inputs));
  const on = catalogue
    .filter((c) => isCapabilityOn(c, inputs))
    .map((c) => c.id as CapabilityId);
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

/** The decisions recorded for one athlete, by Capability id. */
export const decisionsFrom = (
  rows: readonly { capabilityId: string; on: boolean }[]
): CapabilityDecisions =>
  Object.fromEntries(rows.map((row) => [row.capabilityId, row.on]));
