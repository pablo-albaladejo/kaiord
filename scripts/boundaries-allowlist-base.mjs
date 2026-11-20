/**
 * Reads the boundaries allowlist as it stood at the merge base with a base
 * ref, so a swap (one entry removed, a different one added) is caught even
 * though the count stays under BOUNDARIES_ALLOWLIST_MAX.
 */
import { execFileSync } from "node:child_process";

const LIST = "scripts/boundaries-allowlist.mjs";

// A git hook exports GIT_DIR / GIT_INDEX_FILE; inherited, they would point
// every call at the hook's repository instead of `root`.
const gitEnv = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_"))
  );

const defaultGit = (root) => (args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: gitEnv(),
    stdio: ["ignore", "pipe", "pipe"],
  });

const firstLine = (error) =>
  String(error.stderr || error.message)
    .trim()
    .split("\n")[0];

// On origin/main itself the merge base IS HEAD, legitimately.
const isOnMain = (git, head) => {
  try {
    git(["merge-base", "--is-ancestor", head, "origin/main"]);
    return true;
  } catch {
    return false;
  }
};

/**
 * @returns {Promise<{ files?: Set<string>, error?: string }>} The parked files
 *   at the merge base, or an error; callers fail closed on an error.
 */
export async function baseAllowlistFiles({
  root,
  baseRef,
  git = defaultGit(root),
}) {
  let source;
  try {
    const base = git(["merge-base", "HEAD", baseRef]).trim();
    const head = git(["rev-parse", "HEAD"]).trim();
    if (base === head && !isOnMain(git, head)) {
      return {
        error:
          `the merge base with ${baseRef} is HEAD itself (${head.slice(0, 9)}), ` +
          `so the list would be compared with itself; set ` +
          `BOUNDARIES_ALLOWLIST_BASE_REF to the branch HEAD merges into.`,
      };
    }
    source = git(["show", `${base}:${LIST}`]);
  } catch (error) {
    return {
      error:
        `cannot read ${LIST} at the merge base with ${baseRef} (${firstLine(error)}). ` +
        `Fetch it (git fetch origin main) or check out with fetch-depth: 0; ` +
        `without a baseline a swapped-in entry is invisible, so this fails closed.`,
    };
  }
  try {
    const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
    const { BOUNDARIES_ALLOWLIST } = await import(url);
    return { files: new Set(BOUNDARIES_ALLOWLIST.map((e) => e.file)) };
  } catch (error) {
    return {
      error: `cannot evaluate ${LIST} at the merge base (${firstLine(error)}); failing closed.`,
    };
  }
}
