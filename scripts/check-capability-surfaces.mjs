#!/usr/bin/env node
/**
 * Mechanical guard: nothing reaches a Capability's surface without going
 * through the read API (GLOSSARY.md "Capability", ADR 0003). A Capability
 * that is off leaves no trace, and that holds only while every screen,
 * route, settings section, Tool and link asks first.
 *
 * Rules, over every non-test source file of the Kaiord App (TypeScript AST,
 * so comments and strings never count as an import or a reference), where
 * only a value import of the read API counts as asking it:
 *
 * - R-CapabilityModuleThroughReadApi: a file outside a Capability that
 *   imports one of its modules (`MODULES` in the vocab) also asks the read
 *   API. The lazy route table is exempt while the route switch is mounted
 *   inside `CapabilityRouteGate`.
 * - R-CapabilityRouteLiteral: a Capability's route, and the path of a
 *   settings section it owns, is spelled only in the catalogue; anything
 *   else links through `capabilityHome(id)`.
 * - R-CapabilityRegistryGate: a registry of surfaces (navigation, settings,
 *   the assistant's Tools) is named only where it is defined, by its gate
 *   readers, each of which asks the read API, and by its declared lookups.
 * - R-CapabilityDecisionThroughReadApi: a file that reads the athlete's
 *   decisions resolves them through the read API (`application/` included).
 *
 * Inert-by-construction protection: a catalogue that parses to no
 * Capability, a Capability without declared modules, a declared module,
 * reader or lookup that is missing, or one that no longer names its
 * registry, fails.
 *
 * Known gap: a file that imports the read API for one surface and reaches
 * another without asking passes; the read API is a seam, not a proof.
 */

import { pathToFileURL } from "node:url";

import * as VOCAB from "./capability-surfaces.vocab.mjs";
import { readCatalogue } from "./lib/capability-catalogue-ast.mjs";
import { checkDecisions } from "./lib/capability-decision-rules.mjs";
import { checkModules } from "./lib/capability-module-rules.mjs";
import { checkRegistries } from "./lib/capability-registry-rules.mjs";
import { checkRoutes } from "./lib/capability-route-rules.mjs";
import { scanSources, SPA_SRC } from "./lib/capability-source-scan.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";

/** Returns every violation as `{ rule, file, detail }`. */
export function runCheck({ srcRoot = SPA_SRC, vocab = VOCAB } = {}) {
  const catalogue = readCatalogue(srcRoot, vocab.CATALOGUE);
  if (catalogue.length === 0) {
    return [
      {
        rule: "R-CapabilityCatalogue",
        file: vocab.CATALOGUE,
        detail: "parses to no Capability: the guard would check nothing",
      },
    ];
  }
  const files = scanSources(srcRoot);
  return [
    ...checkModules(files, catalogue, vocab, srcRoot),
    ...checkRoutes(files, catalogue, vocab),
    ...checkRegistries(files, vocab, srcRoot),
    ...checkDecisions(files, vocab),
  ];
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const violations = runCheck();
  failIfAny(
    "Capability surface problem(s) reached without the read API",
    violations.map((v) => `[${v.rule}] ${v.file}: ${v.detail}`),
    "Remediation: ask `useCapabilities()` (or wrap in <CapabilityGate surface>) before showing a Capability's surface, link with capabilityHome(id), and declare new surfaces in lib/capabilities/capability-catalogue.ts."
  );
  console.log(
    "✅ Every Capability surface is reached through the read API (useCapabilities)."
  );
}
