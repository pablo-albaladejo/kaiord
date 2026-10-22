type Readable = {
  on(event: "data", listener: (chunk: Buffer | string) => void): unknown;
};

/** The part of a `ChildProcess` the live lane uses. */
export type ChildLike = {
  stdin: { end(chunk: string): unknown } | null;
  stdout: Readable | null;
  stderr: Readable | null;
  on(event: "error", listener: (error: Error) => void): unknown;
  on(event: "close", listener: (code: number | null) => void): unknown;
};

export type SpawnOptions = {
  cwd: string;
  env: Record<string, string>;
  stdio: ["pipe", "pipe", "pipe"];
  shell: false;
};

/**
 * `node:child_process` `spawn`, narrowed. Unit tests inject a double, so no
 * test ever starts the real `claude` binary.
 */
export type SpawnFn = (
  command: string,
  args: Array<string>,
  options: SpawnOptions
) => ChildLike;

export type ProcessResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

/** Arguments as an array and never a shell; `input` goes to stdin. */
export const runProcess = (
  spawn: SpawnFn,
  command: string,
  args: Array<string>,
  options: { cwd: string; env: Record<string, string>; input: string }
): Promise<ProcessResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.stdin?.end(options.input);
  });
