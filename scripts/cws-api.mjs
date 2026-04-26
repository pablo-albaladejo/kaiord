#!/usr/bin/env node
// CWS API helper — service-account auth + upload/publish/state via REST.
//
// Requires Node >= 18 (fetch global, crypto.createSign); repo root pins
// >= 22.12 via engines.node. No third-party dependencies.
//
// CWS_API_BASE_URL is hardcoded as a module-level constant (Factor III
// pragmatic deviation): there is only one Chrome Web Store endpoint
// globally; no staging tier exists. If Google ever ships an alternate,
// extract to env var with the current value as default.
//
// Subcommands print JSON to stdout on success (parseable by workflow
// steps via jq); typed errors go to stderr with stable prefixes
// ([CwsAuthError], [CwsStateError], [CwsTimeoutError]). Exit codes:
//   0 success
//   1 recoverable error (open tracking issue)
//   2 usage error

import { fileURLToPath, pathToFileURL } from "node:url";
import { parseServiceAccountJson } from "./cws-api/auth.mjs";
import { dispatch } from "./cws-api/cli.mjs";

export async function main(argv = process.argv.slice(2), env = process.env) {
  if (argv.length === 0 || argv.includes("--help") || argv[0] === "-h") {
    printUsage();
    return 2;
  }

  const keyJson = env.CWS_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    process.stderr.write(
      "[CwsAuthError] CWS_SERVICE_ACCOUNT_KEY environment variable not set\n",
    );
    return 2;
  }

  let serviceAccount;
  try {
    serviceAccount = parseServiceAccountJson(keyJson);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    return 2;
  }

  return dispatch(argv, serviceAccount);
}

function printUsage() {
  process.stderr.write(
    [
      "Usage: cws-api.mjs <subcommand> <extension-id> [flags]",
      "",
      "Subcommands:",
      "  check          fail-fast auth + access verification",
      "  state          print current CWS state JSON",
      "  upload --source <zip-path>",
      "  publish        publish the uploaded draft",
      "  wait-uploaded --timeout-ms <N>",
      "  wait-published --version <V> --timeout-ms <N>",
      "",
    ].join("\n"),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      // Helper-thrown errors already include stable prefixes; runtime
      // errors are unlikely but redact them defensively.
      const msg = err?.message ?? "unknown error";
      const safe = msg.startsWith("[Cws") ? msg : `[CwsStateError] ${msg}`;
      process.stderr.write(safe + "\n");
      process.exit(1);
    },
  );
}
