// What a claim's proof may be, and whether it still holds. Three kinds:
//   { file, contains? }    a repo file, optionally still holding that text
//   { test, title }        a test file with a test that really runs under
//                          that title (see claims-test-runs.mjs)
//   { endpoint, servedBy } an https URL; a kaiord.com URL names the repo
//                          file that serves it. Not fetched: hermetic.
// How strong a proof is, and whether a claim has one strong enough, is
// claims-strength.mjs.

import { testRunProblem } from "./claims-test-runs.mjs";

const KINDS = {
  file: ["file", "contains"],
  test: ["test", "title"],
  endpoint: ["endpoint", "servedBy"],
};

export const kindOf = (proof) =>
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
  const why =
    typeof proof.title === "string"
      ? testRunProblem(src, proof.title)
      : "no title";
  return why
    ? [
        `${proof.test} has no running test titled ${JSON.stringify(proof.title)} (${why})`,
      ]
    : [];
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
  if (url.hostname === "kaiord.com" && proof.servedBy === undefined)
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
