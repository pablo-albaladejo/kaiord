import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExecFileSync = vi.fn();
vi.mock("node:child_process", () => ({
  execFileSync: mockExecFileSync,
}));

describe("ensureExitNode", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.TS_EXIT_NODE;
  });

  it("should call tailscale set with exit node from env", async () => {
    process.env.TS_EXIT_NODE = "100.116.150.51";

    const { ensureExitNode } = await import("./tailscale-exit-node");
    ensureExitNode();

    expect(mockExecFileSync).toHaveBeenCalledWith(
      "/opt/extensions/bin/tailscale",
      ["--socket=/tmp/tailscale.sock", "set", "--exit-node=100.116.150.51"],
      { stdio: "pipe", timeout: 5000, shell: false }
    );
  });

  it("should skip when TS_EXIT_NODE is not set", async () => {
    const { ensureExitNode } = await import("./tailscale-exit-node");
    ensureExitNode();

    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  it("should only configure once per container", async () => {
    process.env.TS_EXIT_NODE = "100.116.150.51";

    const { ensureExitNode } = await import("./tailscale-exit-node");
    ensureExitNode();
    ensureExitNode();

    expect(mockExecFileSync).toHaveBeenCalledTimes(1);
  });

  it("should log error and continue if tailscale set fails", async () => {
    process.env.TS_EXIT_NODE = "100.116.150.51";
    mockExecFileSync.mockImplementation(() => {
      throw new Error("Command failed");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { ensureExitNode } = await import("./tailscale-exit-node");
    ensureExitNode();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to set Tailscale exit node",
      expect.objectContaining({ exitNode: "100.116.150.51" })
    );
    consoleSpy.mockRestore();
  });
});
