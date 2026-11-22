// A claim that states a fact needs a strong proof: a running test, or a pin
// (`contains`, MIN_PIN characters or more) in a file that is not one of its
// register's surfaces. A file merely existing, an endpoint, or the surface
// itself proves nothing about what the sentence says. A label needs none;
// an external claim's proofs, when it has any, must still hold.

import { kindOf, proofProblems } from "./claims-proof.mjs";
import { kindOfClaim, shapeProblems } from "./claims-shape.mjs";

export const MIN_PIN = 16;

// "test", "pinned", or null when no proof says what the sentence says.
export const proofStrength = (claim, ownFiles) => {
  const proofs = Array.isArray(claim.proof) ? claim.proof : [];
  if (proofs.some((p) => kindOf(p) === "test")) return "test";
  const pinned = (p) =>
    kindOf(p) === "file" &&
    !ownFiles.has(p.file) &&
    typeof p.contains === "string" &&
    p.contains.trim().length >= MIN_PIN;
  return proofs.some(pinned) ? "pinned" : null;
};

const WEAK = `is proven only by a file existing, an endpoint or its own surface; prove it with a running test or a pin of ${MIN_PIN}+ characters in code, or declare it kind "label" (it states nothing) or "external"`;

// `ownFiles`: the register's surface files; `today`: a timestamp.
export const claimProblems = (claim, read, { ownFiles, today }) => {
  const where = `claim "${claim.id}"`;
  const shape = shapeProblems(claim, today);
  const kind = kindOfClaim(claim);
  const proofs = Array.isArray(claim.proof) ? claim.proof : [];
  if (kind === "claim" && proofs.length === 0)
    return [...shape, `${where}: has no proof`];
  const broken = proofs.flatMap((proof) =>
    proofProblems(proof, read).map((p) => `${where}: ${p}`)
  );
  const weak =
    kind === "claim" && broken.length === 0 && !proofStrength(claim, ownFiles);
  return [...shape, ...broken, ...(weak ? [`${where}: ${WEAK}`] : [])];
};
