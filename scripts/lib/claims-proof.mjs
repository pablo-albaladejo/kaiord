// What a claim's proof may be, and whether it still exists. Three kinds:
//   { file, contains? }   a repo file, optionally still holding that exact text
//   { test, title }       a test file with a RUNNING `it("title"` / `test("title"`
//                         (an `it.skip`/`it.todo` proves nothing)
//   { endpoint, servedBy } an https URL; a kaiord.com URL names the repo file
//                         that serves it. Not fetched: the guard stays hermetic.

import { unknownFields } from "./claims-owners.mjs";

const KINDS = {
  file: ["file", "contains"],
  test: ["test", "title"],
  endpoint: ["endpoint", "servedBy"],
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasRunningTest = (src, title) =>
  new RegExp(`\\b(?:it|test)\\(\\s*(["'\`])${escapeRegExp(title)}\\1`).test(
    src
  );

const kindOf = (proof) =>
  Object.keys(KINDS).find((kind) => typeof proof?.[kind] === "string");

const fileProblems = (proof, read) => {
  const src = read(proof.file);
  if (src === null) return [`proof file ${proof.file} does not exist`];
  if (proof.contains !== undefined && !src.includes(proof.contains))
    return [
      `${proof.file} no longer contains ${JSON.stringify(proof.contains)}`,
    ];
  return [];
};

const testProblems = (proof, read) => {
  const src = read(proof.test);
  if (src === null) return [`proof test ${proof.test} does not exist`];
  if (typeof proof.title !== "string" || !hasRunningTest(src, proof.title))
    return [
      `${proof.test} has no running test titled ${JSON.stringify(proof.title)}`,
    ];
  return [];
};

const endpointProblems = (proof, read) => {
  let url;
  try {
    url = new URL(proof.endpoint);
  } catch {
    return [`endpoint ${proof.endpoint} is not a URL`];
  }
  if (url.protocol !== "https:")
    return [`endpoint ${proof.endpoint} is not https`];
  const ours = url.hostname === "kaiord.com";
  if (ours && proof.servedBy === undefined)
    return [`endpoint ${proof.endpoint} names no servedBy file`];
  if (proof.servedBy !== undefined && read(proof.servedBy) === null)
    return [
      `endpoint ${proof.endpoint}: servedBy ${proof.servedBy} does not exist`,
    ];
  return [];
};

const CHECK = {
  file: fileProblems,
  test: testProblems,
  endpoint: endpointProblems,
};

export const proofProblems = (proof, read) => {
  const kind = kindOf(proof);
  if (!kind)
    return [`proof ${JSON.stringify(proof)} is none of file, test, endpoint`];
  const unknown = Object.keys(proof).filter((k) => !KINDS[kind].includes(k));
  if (unknown.length > 0)
    return [
      `proof ${JSON.stringify(proof)} has unknown field(s) ${unknown.join(", ")}`,
    ];
  return CHECK[kind](proof, read);
};

const CLAIM_FIELDS = ["id", "text", "proof"];

// A claim: only its known fields, and at least one proof that still holds.
export const claimProblems = (claim, read) => {
  const where = `claim "${claim.id}"`;
  const shape = unknownFields(where, claim, CLAIM_FIELDS);
  if (!Array.isArray(claim.proof) || claim.proof.length === 0)
    return [...shape, `${where}: has no proof`];
  return [
    ...shape,
    ...claim.proof.flatMap((proof) =>
      proofProblems(proof, read).map((p) => `${where}: ${p}`)
    ),
  ];
};
