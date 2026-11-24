// An author statement: what the repository's owner declares, on a date, in
// exact words. It is a declaration, not evidence: no test or code here can
// check it, so a claim that rests on one is counted as declared, never as
// proven (claims-strength.mjs). It names its author by role only; the
// register holds no person's name or email.
//   { "author-statement": "<exact words>", by: "<role>", on: "YYYY-MM-DD" }

export const STATEMENT_FIELDS = ["author-statement", "by", "on"];
export const STATEMENT_ROLES = ["the repository's owner"];

const EMAIL = /[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}/i;

export const statementProblems = (proof) => {
  const words = proof["author-statement"];
  const where = `author statement ${JSON.stringify(words)}`;
  if (typeof words !== "string")
    return [`${where}: is not words; it states the owner's exact words`];
  if (words.trim() === "") return [`${where}: states nothing`];
  const problems = [];
  if (!STATEMENT_ROLES.includes(proof.by))
    problems.push(
      `${where}: by names a role (${STATEMENT_ROLES.join(", ")}), never a person`
    );
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(proof.on ?? "") ||
    Number.isNaN(Date.parse(`${proof.on}T00:00:00Z`))
  )
    problems.push(`${where}: on is the date it was made (YYYY-MM-DD)`);
  if (EMAIL.test(words) || EMAIL.test(String(proof.by ?? "")))
    problems.push(
      `${where}: holds an email address; the register names no person`
    );
  return problems;
};
