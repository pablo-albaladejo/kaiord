import { execa } from "execa";
import { dir } from "tmp-promise";

/**
 * Execute the CLI as a child process for integration testing
 * @param args - CLI arguments to pass
 * @returns Promise with execution result
 */
export const runCli = async (args: string[]) => {
  return await execa("node", ["dist/bin/kaiord.js", ...args]);
};

/**
 * Create a temporary directory for test files
 * @returns Object with path and cleanup function
 */
export const createTempDir = async (): Promise<{
  path: string;
  cleanup: () => Promise<void>;
}> => {
  const { path, cleanup } = await dir({ unsafeCleanup: true });
  return { path, cleanup };
};
