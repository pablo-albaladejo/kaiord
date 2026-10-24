export class UnestimableError extends Error {}

// Thrown wherever a faithful estimate is impossible; the public entry point
// turns only this error into "no estimate", so real bugs still surface.
export const hide = (): never => {
  throw new UnestimableError("coach text cannot be estimated");
};
