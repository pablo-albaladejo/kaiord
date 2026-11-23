// The checks of one register file once its ownership is settled: every
// surface reads, every unit of text on it has an entry, and each text appears
// on the surfaces exactly as many times as the register accounts for it (one
// per entry, or the entry's `count`), so a short unit ("5", "Accounts") added
// a second time cannot ride on the first one's proof.

import { roundTripProblems } from "./claims-round-trip.mjs";
import { kindOfClaim } from "./claims-shape.mjs";
import { claimProblems, proofStrength } from "./claims-strength.mjs";
import { surfaceUnits } from "./claims-units.mjs";

// [{ file, units }] for the surfaces that read, and what failed for the rest.
export const readSurfaces = (surfaces, read) => {
  const problems = [];
  const found = [];
  for (const surface of surfaces) {
    const src = read(surface.file);
    if (src === null) {
      problems.push(`${surface.file}: registered surface does not exist`);
      continue;
    }
    const { units, error } = surfaceUnits(surface, src);
    if (error) problems.push(error);
    else if (units.length === 0)
      problems.push(`${surface.file}: registered surface shows no text`);
    else found.push({ file: surface.file, units });
  }
  return { problems, found };
};

const tally = (texts) => {
  const counts = new Map();
  for (const [text, n] of texts) counts.set(text, (counts.get(text) ?? 0) + n);
  return counts;
};

const multiplicityProblems = (name, claims, found) => {
  const shown = tally(found.flatMap((s) => s.units.map((u) => [u, 1])));
  const owned = tally(claims.map((c) => [c.text, c.count ?? 1]));
  const problems = [];
  for (const { file, units } of found)
    for (const unit of new Set(units))
      if (!owned.has(unit))
        problems.push(`${file}: unregistered claim "${unit}"`);
  for (const claim of claims) {
    const times = shown.get(claim.text) ?? 0;
    if (times === 0)
      problems.push(
        `${name}: claim "${claim.id}" is on none of its surfaces; delete the entry`
      );
  }
  for (const [text, times] of shown) {
    const entries = owned.get(text);
    if (entries !== undefined && entries !== times)
      problems.push(
        `${name}: "${text}" appears ${times} time(s) on its surfaces but the register accounts for ${entries}; add an entry for each new occurrence (or a count when it is the same claim)`
      );
  }
  return problems;
};

export const registerProblems = (name, data, read, today) => {
  const { problems, found } = readSurfaces(data.surfaces, read);
  const ownFiles = new Set(data.surfaces.map((s) => s.file));
  const claims = data.claims;
  if (problems.length === 0)
    problems.push(...multiplicityProblems(name, claims, found));
  else
    for (const { file, units } of found)
      for (const unit of new Set(units))
        if (!claims.some((c) => c.text === unit))
          problems.push(`${file}: unregistered claim "${unit}"`);
  for (const claim of claims) {
    problems.push(...claimProblems(claim, read, { ownFiles, today }));
    problems.push(...roundTripProblems(claim));
  }
  const strength = claims.map((c) =>
    kindOfClaim(c) === "claim"
      ? (proofStrength(c, ownFiles) ?? "weak")
      : kindOfClaim(c)
  );
  return { problems, strength };
};
