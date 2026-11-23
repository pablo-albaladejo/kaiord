/**
 * Characters per token for an estimate made before or without the
 * Provider's count. Tokenizers average nearer 4 characters a token for
 * English; 3 leans high, so an estimate errs toward a larger cost.
 */
export const CHARS_PER_TOKEN = 3;

export const estimateTokens = (chars: number): number =>
  Math.ceil(chars / CHARS_PER_TOKEN);
