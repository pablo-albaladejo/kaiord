// The one registry of unsaved work in this tab: drafts, edits, imports and
// generations in flight, questions awaiting an answer. Every surface that
// holds such work reports here (`useUnsavedWork`), and the update flow reads
// it before it lets a new version take over, so an update never discards
// work. `unsaved-work-reporters.test.ts` fails on a draft that does not.

const armed = new Set<symbol>();
const probes = new Set<() => boolean>();

/** Marks the tab as holding unsaved work until the returned disarm runs. */
export function armUnsavedEdits(): () => void {
  const token = Symbol("unsaved");
  armed.add(token);
  return () => {
    armed.delete(token);
  };
}

/** Adds a check asked at read time, for work no hook can arm. */
export function registerUnsavedProbe(probe: () => boolean): () => void {
  probes.add(probe);
  return () => {
    probes.delete(probe);
  };
}

export const hasUnsavedEdits = (): boolean =>
  armed.size > 0 || [...probes].some((probe) => probe());
