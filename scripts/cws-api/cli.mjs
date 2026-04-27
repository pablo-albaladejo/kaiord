// Subcommand dispatcher for cws-api.mjs. Each subcommand prints JSON
// stdout on success and translates typed errors into the appropriate
// exit code (1 for recoverable, 2 for usage).

import { mintAccessToken } from "./auth.mjs";
import { CwsAuthError, CwsStateError, CwsTimeoutError } from "./errors.mjs";
import { getItem } from "./state.mjs";
import { uploadCrx } from "./upload.mjs";
import { publishItem } from "./publish.mjs";
import { waitPublished, waitUploaded } from "./poll.mjs";

export async function dispatch(argv, serviceAccount) {
  const [subcommand, id, ...rest] = argv;
  const flags = parseFlags(rest);
  try {
    const result = await runSubcommand(subcommand, id, flags, serviceAccount);
    if (result !== undefined) {
      process.stdout.write(JSON.stringify(result) + "\n");
    }
    return 0;
  } catch (err) {
    return handleError(err);
  }
}

async function runSubcommand(subcommand, id, flags, serviceAccount) {
  if (!subcommand) throw new UsageError("missing subcommand");
  if (subcommand === "check") {
    if (!id) throw new UsageError("check requires <extension-id>");
    await mintAccessToken(serviceAccount);
    return await getItem(serviceAccount, id, "DRAFT");
  }
  if (subcommand === "state") {
    if (!id) throw new UsageError("state requires <extension-id>");
    return await getItem(serviceAccount, id, flags.projection ?? "DRAFT");
  }
  if (subcommand === "upload") {
    if (!id || !flags.source) {
      throw new UsageError("upload requires <id> --source <zip>");
    }
    return await uploadCrx(serviceAccount, id, flags.source);
  }
  if (subcommand === "publish") {
    if (!id) throw new UsageError("publish requires <extension-id>");
    return await publishItem(serviceAccount, id, {
      trustedTesters: flags.trustedTesters === true,
    });
  }
  if (subcommand === "wait-uploaded") {
    if (!id) throw new UsageError("wait-uploaded requires <extension-id>");
    return await waitUploaded(serviceAccount, id, {
      timeoutMs: flags.timeoutMs ?? 60000,
    });
  }
  if (subcommand === "wait-published") {
    if (!id || !flags.version) {
      throw new UsageError("wait-published requires <id> --version <V>");
    }
    return await waitPublished(serviceAccount, id, {
      version: flags.version,
      timeoutMs: flags.timeoutMs ?? 120000,
    });
  }
  throw new UsageError(`unknown subcommand: ${subcommand}`);
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--source") flags.source = args[++i];
    else if (arg === "--version") flags.version = args[++i];
    else if (arg === "--projection") flags.projection = args[++i];
    else if (arg === "--timeout-ms") flags.timeoutMs = Number(args[++i]);
    else if (arg === "--trusted-testers") flags.trustedTesters = true;
  }
  return flags;
}

class UsageError extends Error {}

function handleError(err) {
  if (err instanceof UsageError) {
    process.stderr.write(`[CwsStateError] usage: ${err.message}\n`);
    return 2;
  }
  if (
    err instanceof CwsAuthError ||
    err instanceof CwsStateError ||
    err instanceof CwsTimeoutError
  ) {
    process.stderr.write(err.message + "\n");
    return 1;
  }
  process.stderr.write(`[CwsStateError] ${err?.code ?? "ERR"}\n`);
  return 1;
}
