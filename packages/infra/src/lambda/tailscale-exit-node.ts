import { execFileSync } from "node:child_process";

const TS_CLI = "/opt/extensions/bin/tailscale";
const TS_SOCKET = "/tmp/tailscale.sock";

let configured = false;

export const ensureExitNode = (): void => {
  if (configured) return;

  const exitNode = process.env.TS_EXIT_NODE;
  if (!exitNode) return;

  try {
    execFileSync(
      TS_CLI,
      [`--socket=${TS_SOCKET}`, "set", `--exit-node=${exitNode}`],
      { stdio: "pipe", timeout: 5000, shell: false }
    );
    configured = true;
    console.log("Tailscale exit node configured", { exitNode });
  } catch (error) {
    const msg = error instanceof Error ? error.message.slice(0, 100) : "";
    console.error("Failed to set Tailscale exit node", {
      exitNode,
      error: msg,
    });
  }
};
