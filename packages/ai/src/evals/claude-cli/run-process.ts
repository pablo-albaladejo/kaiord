import { harnessFault, messageOf } from "./harness-fault";

type Readable = {
  on(event: "data", listener: (chunk: Buffer | string) => void): unknown;
};

/** The part of a `ChildProcess` the live lane uses. */
export type ChildLike = {
  stdin: {
    end(chunk: string): unknown;
    on(event: "error", listener: (error: Error) => void): unknown;
  } | null;
  stdout: Readable | null;
  stderr: Readable | null;
  on(event: "error", listener: (error: Error) => void): unknown;
  on(event: "close", listener: (code: number | null) => void): unknown;
  kill(signal: "SIGKILL"): unknown;
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

export const DEFAULT_PROCESS_TIMEOUT_MS = 300_000;

export type RunOptions = {
  cwd: string;
  env: Record<string, string>;
  input: string;
  timeoutMs?: number;
};

/**
 * Arguments as an array and never a shell; `input` goes to stdin. A child
 * still running after `timeoutMs` is killed and the call is a harness fault.
 */
export const runProcess = (
  spawn: SpawnFn,
  command: string,
  args: Array<string>,
  options: RunOptions
): Promise<ProcessResult> =>
  new Promise((resolve, reject) => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_PROCESS_TIMEOUT_MS;
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
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        harnessFault(
          `${command} did not exit within ${timeoutMs} ms and was killed`
        )
      );
    }, timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    // A child that exits before reading its prompt raises EPIPE here.
    child.stdin?.on("error", (error) => {
      clearTimeout(timer);
      // Killed first: the caller removes the child's cwd once this settles.
      child.kill("SIGKILL");
      reject(
        harnessFault(
          `could not write the prompt to ${command}: ${messageOf(error)}`
        )
      );
    });
    child.stdin?.end(options.input);
  });
