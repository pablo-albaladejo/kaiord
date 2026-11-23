/**
 * R-CapabilityModuleThroughReadApi: a file outside a Capability that imports
 * one of its modules (`MODULES` in the vocab, keyed by catalogue id) asks the
 * read API. Every Capability declares its modules, and every declared
 * module exists. A violation is `{ rule, file, detail }`.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readsApi, within } from "./capability-read-api.mjs";
import { exists } from "./capability-source-scan.mjs";

const RULE = "R-CapabilityModuleThroughReadApi";

const ownerOf = (path, owners) =>
  owners.find((o) => o.modules.some((m) => within(path, m)));

const routeTableGated = (vocab, srcRoot) => {
  const mount = join(srcRoot, vocab.ROUTE_TABLE.mountedBy);
  return (
    existsSync(mount) &&
    readFileSync(mount, "utf8").includes(`<${vocab.ROUTE_TABLE.gate}`)
  );
};

const declarationProblems = (catalogue, vocab, srcRoot) => {
  const ids = new Set(catalogue.map((c) => c.id));
  const undeclared = catalogue
    .filter((c) => !(c.id in vocab.MODULES))
    .map((c) => ({ rule: RULE, file: c.id, detail: "declares no `MODULES`" }));
  const orphans = Object.keys(vocab.MODULES)
    .filter((id) => !ids.has(id))
    .map((id) => ({ rule: RULE, file: id, detail: "no such Capability" }));
  const missing = Object.entries(vocab.MODULES).flatMap(([id, modules]) =>
    modules
      .filter((m) => !exists(srcRoot, m))
      .map((m) => ({
        rule: RULE,
        file: m,
        detail: `declared by Capability "${id}" but missing: update its \`MODULES\``,
      }))
  );
  return [...undeclared, ...orphans, ...missing];
};

export function checkModules(files, catalogue, vocab, srcRoot) {
  const owners = Object.entries(vocab.MODULES).map(([id, modules]) => ({
    id,
    modules,
  }));
  const gatedTable = routeTableGated(vocab, srcRoot);
  const violations = declarationProblems(catalogue, vocab, srcRoot);
  for (const file of files) {
    const own = ownerOf(file.path, owners);
    if (file.path === vocab.ROUTE_TABLE.file && gatedTable) continue;
    const reached = file.imports
      .map(({ target }) => ({ target, owner: ownerOf(target, owners) }))
      .filter(({ owner }) => owner && owner !== own);
    if (reached.length === 0 || readsApi(file, vocab)) continue;
    for (const { target, owner } of reached) {
      violations.push({
        rule: RULE,
        file: file.path,
        detail: `imports "${target}" of Capability "${owner.id}" without the read API`,
      });
    }
  }
  return violations;
}
