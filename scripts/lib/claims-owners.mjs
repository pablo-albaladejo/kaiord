// Which register file owns what. A claim id, a whole file, or one section or
// key of a file belongs to one register file only, so two files can never
// disagree about the same text. Different sections of one file (the privacy
// policy's per-extension sections) may sit in different register files, so
// parallel tickets edit different files.

import { unknownFields } from "./claims-shape.mjs";

const SURFACE_FIELDS = ["file", "intro", "sections", "keys"];

// The parts of a file a surface claims: its intro, its named sections or keys,
// or the whole file (null) when it names none of them.
const surfaceParts = (surface) => {
  const intro = surface.intro ? ["intro"] : [];
  if (surface.sections)
    return [...intro, ...surface.sections.map((s) => `section "${s}"`)];
  if (surface.intro) return intro;
  if (surface.keys) return surface.keys.map((k) => `key "${k}"`);
  return null;
};

const surfaceOwnerProblems = (name, surface, owners) => {
  const owned = owners.surfaces.get(surface.file) ?? { parts: new Map() };
  owners.surfaces.set(surface.file, owned);
  const taken = `${name}: surface ${surface.file}`;
  const first = owned.whole ?? owned.parts.values().next().value;
  const parts = surfaceParts(surface);
  if (owned.whole || (parts === null && first))
    return [`${taken} is already registered in ${first}`];
  if (parts === null) {
    owned.whole = name;
    return [];
  }
  return parts.flatMap((part) => {
    const owner = owned.parts.get(part);
    if (owner) return [`${taken} (${part}) is already registered in ${owner}`];
    owned.parts.set(part, name);
    return [];
  });
};

// `owners` is shared across register files: { surfaces: Map, ids: Map }.
export const duplicateProblems = (name, data, owners) => {
  const problems = [];
  for (const surface of data.surfaces) {
    problems.push(
      ...unknownFields(
        `${name}: surface ${surface.file}`,
        surface,
        SURFACE_FIELDS
      ),
      ...surfaceOwnerProblems(name, surface, owners)
    );
  }
  for (const { id } of data.claims) {
    const owner = owners.ids.get(id);
    if (owner)
      problems.push(`${name}: claim id "${id}" is already used in ${owner}`);
    else owners.ids.set(id, name);
  }
  return problems;
};
