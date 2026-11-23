/**
 * The three rules of `check-capability-surfaces.mjs`, each over the scanned
 * sources. A violation is `{ rule, file, detail }`.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { exists, stripModule } from "./capability-source-scan.mjs";

/** Whether a src-relative path (with or without extension) is in a module entry. */
const within = (path, entry) => {
  const bare = stripModule(path);
  return entry.endsWith("/")
    ? `${bare}/`.startsWith(entry)
    : bare === stripModule(entry);
};

const ownerOf = (path, catalogue) =>
  catalogue.find((c) => c.modules.some((m) => within(path, m)));

const readsApi = (file, vocab) =>
  file.imports.some((target) =>
    vocab.READ_API.some((api) => within(target, api))
  );

const routeTableGated = (vocab, srcRoot) => {
  const mount = join(srcRoot, vocab.ROUTE_TABLE.mountedBy);
  return (
    existsSync(mount) &&
    readFileSync(mount, "utf8").includes(`<${vocab.ROUTE_TABLE.gate}`)
  );
};

const missingModules = (catalogue, srcRoot) =>
  catalogue.flatMap((c) =>
    c.modules
      .filter((m) => !exists(srcRoot, m))
      .map((m) => ({
        rule: "R-CapabilityModuleThroughReadApi",
        file: m,
        detail: `declared by Capability "${c.id}" but missing: update its \`modules\``,
      }))
  );

export function checkModules(files, catalogue, vocab, srcRoot) {
  const gatedTable = routeTableGated(vocab, srcRoot);
  const violations = missingModules(catalogue, srcRoot);
  for (const file of files) {
    const own = ownerOf(file.path, catalogue);
    if (file.path === vocab.ROUTE_TABLE.file && gatedTable) continue;
    const reached = file.imports
      .map((target) => ({ target, owner: ownerOf(target, catalogue) }))
      .filter(({ owner }) => owner && owner !== own);
    if (reached.length === 0 || readsApi(file, vocab)) continue;
    for (const { target, owner } of reached) {
      violations.push({
        rule: "R-CapabilityModuleThroughReadApi",
        file: file.path,
        detail: `imports "${target}" of Capability "${owner.id}" without the read API`,
      });
    }
  }
  return violations;
}

const spellsRoute = (literal, route) =>
  literal === route || /^[/?#]/.test(literal.slice(route.length))
    ? literal.startsWith(route)
    : false;

export function checkRoutes(files, catalogue, vocab) {
  const routes = catalogue.flatMap((c) => c.routes.map((r) => [c.id, r]));
  return files
    .filter((file) => file.path !== vocab.CATALOGUE)
    .flatMap((file) =>
      file.literals.flatMap((literal) =>
        routes
          .filter(([, route]) => spellsRoute(literal, route))
          .map(([id, route]) => ({
            rule: "R-CapabilityRouteLiteral",
            file: file.path,
            detail: `spells "${route}" of Capability "${id}": link with capabilityHome("${id}")`,
          }))
      )
    );
}

const declaredProblems = (registry, files, srcRoot) => {
  const declared = [
    ...registry.definedIn,
    ...registry.readers,
    ...Object.keys(registry.lookups ?? {}),
  ];
  return declared
    .filter((path) => {
      const file = files.find((f) => f.path === path);
      return !exists(srcRoot, path) || !file?.identifiers.has(registry.symbol);
    })
    .map((path) => ({
      rule: "R-CapabilityRegistryGate",
      file: path,
      detail: `declared for ${registry.name} but missing or no longer naming ${registry.symbol}`,
    }));
};

export function checkRegistries(files, vocab, srcRoot) {
  return vocab.REGISTRIES.flatMap((registry) => {
    const allowed = new Set([
      ...registry.definedIn,
      ...registry.readers,
      ...Object.keys(registry.lookups ?? {}),
    ]);
    const strays = files
      .filter((f) => f.identifiers.has(registry.symbol) && !allowed.has(f.path))
      .map((f) => ({
        rule: "R-CapabilityRegistryGate",
        file: f.path,
        detail: `reads ${registry.symbol} (${registry.name}) outside its gate`,
      }));
    const ungated = registry.readers
      .map((path) => files.find((f) => f.path === path))
      .filter((f) => f && !readsApi(f, vocab))
      .map((f) => ({
        rule: "R-CapabilityRegistryGate",
        file: f.path,
        detail: `gates ${registry.name} but does not import the read API`,
      }));
    return [
      ...declaredProblems(registry, files, srcRoot),
      ...strays,
      ...ungated,
    ];
  });
}
