/**
 * TrainingPeaks answers 429 to rapid requests; clients keep about 150 ms
 * between calls. `space()` waits out what is left of that interval since
 * the last read, so a read is delayed, never refused.
 */
type PacingOptions = {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  minIntervalMs?: number;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const createReadPacing = ({
  now = () => Date.now(),
  sleep = wait,
  minIntervalMs = 150,
}: PacingOptions = {}) => {
  let lastReadAt: number | null = null;
  return async (): Promise<void> => {
    if (lastReadAt !== null) {
      const left = minIntervalMs - (now() - lastReadAt);
      if (left > 0) await sleep(left);
    }
    lastReadAt = now();
  };
};
