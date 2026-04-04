import { execFileSync } from "node:child_process";

const TS_CLI = "/opt/extensions/bin/tailscale";
const TS_SOCKET = "/tmp/tailscale.sock";

let configured = false;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitForExitNode = async (maxWaitMs = 10000): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const status = execFileSync(
        TS_CLI,
        [`--socket=${TS_SOCKET}`, "status", "--json"],
        { stdio: "pipe", timeout: 3000, shell: false }
      ).toString();
      const parsed = JSON.parse(status) as {
        ExitNodeStatus?: { Online: boolean };
      };
      if (parsed.ExitNodeStatus?.Online) return true;
    } catch {
      // status command failed, retry
    }
    await sleep(500);
  }
  return false;
};

export const ensureExitNode = async (): Promise<void> => {
  if (configured) return;

  const exitNode = process.env.TS_EXIT_NODE;
  if (!exitNode) return;

  try {
    execFileSync(
      TS_CLI,
      [`--socket=${TS_SOCKET}`, "set", `--exit-node=${exitNode}`],
      { stdio: "pipe", timeout: 5000, shell: false }
    );
    const ready = await waitForExitNode();
    configured = ready;
    console.log("Tailscale exit node configured", { exitNode, ready });
  } catch (error) {
    const msg = error instanceof Error ? error.message.slice(0, 100) : "";
    console.error("Failed to set Tailscale exit node", {
      exitNode,
      error: msg,
    });
  }
};
