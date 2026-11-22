// The shape of a register entry, apart from its proofs. A claim is one of:
//   (no kind)          states a fact: needs a proof by test or pinned code
//   kind "label"       states nothing (a heading, a button, a navigation
//                      link): needs no proof and may carry none
//   kind "external"    restates what a third party published (a Platform's
//                      terms, Chrome's documented behaviour): carries the
//                      `url` read and `read_on` (ISO date), and goes stale
//                      after STALE_DAYS, so it is read again
// `count` declares how many times the text appears on the register's
// surfaces when it is the same claim each time (default 1).

export const STALE_DAYS = 180;

const FIELDS = {
  claim: ["id", "text", "proof", "count"],
  label: ["id", "text", "kind", "count"],
  external: ["id", "text", "kind", "url", "read_on", "proof", "count"],
};

export const unknownFields = (what, object, allowed) => {
  const unknown = Object.keys(object).filter((k) => !allowed.includes(k));
  return unknown.length > 0
    ? [`${what} has unknown field(s) ${unknown.join(", ")}`]
    : [];
};

export const kindOfClaim = (claim) => claim.kind ?? "claim";

const externalProblems = (where, claim, today) => {
  const problems = [];
  if (!/^https:\/\/\S+$/.test(claim.url ?? ""))
    problems.push(`${where}: an external claim names the https url it read`);
  const read = /^\d{4}-\d{2}-\d{2}$/.test(claim.read_on ?? "")
    ? Date.parse(`${claim.read_on}T00:00:00Z`)
    : NaN;
  if (Number.isNaN(read))
    problems.push(`${where}: an external claim has read_on (YYYY-MM-DD)`);
  else if ((today - read) / 86_400_000 > STALE_DAYS)
    problems.push(
      `${where}: read on ${claim.read_on}, more than ${STALE_DAYS} days ago; read ${claim.url} again and update read_on`
    );
  return problems;
};

// Problems with the entry itself; `today` is a timestamp (Date.now()).
export const shapeProblems = (claim, today) => {
  const where = `claim "${claim.id}"`;
  const kind = kindOfClaim(claim);
  if (!FIELDS[kind] || (kind === "claim" && claim.kind !== undefined))
    return [
      `${where}: kind ${JSON.stringify(claim.kind)} is none of label, external`,
    ];
  const problems = unknownFields(where, claim, FIELDS[kind]);
  if (
    claim.count !== undefined &&
    !(Number.isInteger(claim.count) && claim.count >= 2)
  )
    problems.push(`${where}: count is a whole number of 2 or more`);
  if (kind === "external")
    problems.push(...externalProblems(where, claim, today));
  return problems;
};
