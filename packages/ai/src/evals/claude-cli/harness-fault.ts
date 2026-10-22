/**
 * A fault of the instrument, never of the model: a case it touches is
 * unmeasured, not failed.
 */
export type HarnessFault = Error & { harnessFault: true };

export const harnessFault = (message: string): HarnessFault =>
  Object.assign(new Error(message), { harnessFault: true as const });

export const isHarnessFault = (error: unknown): error is HarnessFault =>
  error instanceof Error &&
  (error as Partial<HarnessFault>).harnessFault === true;

export const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
