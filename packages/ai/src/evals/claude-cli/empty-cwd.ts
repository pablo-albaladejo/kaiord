import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Runs `work` from a freshly created empty directory, removed afterwards
 * whether it succeeded or failed: no `CLAUDE.md`, settings, hooks or MCP
 * config of the maintainer's checkout is in reach of the child.
 */
export const withEmptyCwd = async <T>(
  work: (cwd: string) => Promise<T>
): Promise<T> => {
  const cwd = await mkdtemp(join(tmpdir(), "kaiord-eval-"));
  try {
    return await work(cwd);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
};
