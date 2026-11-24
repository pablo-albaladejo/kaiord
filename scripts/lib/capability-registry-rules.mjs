/**
 * R-CapabilityRegistryGate: a registry of surfaces (navigation, settings,
 * the assistant's Tools) is named only where it is defined, by its gate
 * readers, each of which asks the read API, and by its declared lookups. A
 * reader outside React that is handed the answer (`askedBy`) is gated by the
 * file that asks for it, which must itself ask the read API.
 */

import { readsApi } from "./capability-read-api.mjs";
import { exists } from "./capability-source-scan.mjs";

const RULE = "R-CapabilityRegistryGate";

const readerFile = (reader) =>
  typeof reader === "string" ? reader : reader.file;

const askingFile = (reader) =>
  typeof reader === "string" ? reader : reader.askedBy;

const declared = (registry) => [
  ...registry.definedIn,
  ...registry.readers.map(readerFile),
  ...Object.keys(registry.lookups ?? {}),
];

const declaredProblems = (registry, files, srcRoot) =>
  declared(registry)
    .filter((path) => {
      const file = files.find((f) => f.path === path);
      return !exists(srcRoot, path) || !file?.identifiers.has(registry.symbol);
    })
    .map((path) => ({
      rule: RULE,
      file: path,
      detail: `declared for ${registry.name} but missing or no longer naming ${registry.symbol}`,
    }));

export function checkRegistries(files, vocab, srcRoot) {
  return vocab.REGISTRIES.flatMap((registry) => {
    const allowed = new Set(declared(registry));
    const strays = files
      .filter((f) => f.identifiers.has(registry.symbol) && !allowed.has(f.path))
      .map((f) => ({
        rule: RULE,
        file: f.path,
        detail: `reads ${registry.symbol} (${registry.name}) outside its gate`,
      }));
    const ungated = registry.readers
      .map(askingFile)
      .filter((path) => {
        const file = files.find((f) => f.path === path);
        return !file || !readsApi(file, vocab);
      })
      .map((path) => ({
        rule: RULE,
        file: path,
        detail: `gates ${registry.name} but does not import the read API`,
      }));
    return [
      ...declaredProblems(registry, files, srcRoot),
      ...strays,
      ...ungated,
    ];
  });
}
