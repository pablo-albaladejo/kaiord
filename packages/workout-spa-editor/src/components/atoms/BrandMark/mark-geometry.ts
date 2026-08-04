/** Coordinates of `assets/mark.svg`, in its 32-unit space. */

export const MARK_HULL =
  "M16 5L6.47 10.5L6.47 21.5L16 27L25.53 21.5L25.53 10.5Z";

export const MARK_SPOKES: ReadonlyArray<
  readonly [number, number, number, number]
> = [
  [16, 11.4, 16, 7.6],
  [12.02, 13.7, 8.72, 11.8],
  [12.02, 18.3, 8.72, 20.2],
  [16, 20.6, 16, 24.4],
  [19.98, 18.3, 23.28, 20.2],
  [19.98, 13.7, 23.28, 11.8],
];

export const MARK_NODES: ReadonlyArray<readonly [number, number]> = [
  [16, 5],
  [6.47, 10.5],
  [6.47, 21.5],
  [16, 27],
  [25.53, 21.5],
  [25.53, 10.5],
];

export const MARK_NODE_RADIUS = 1.9;
export const MARK_CORE_RADIUS = 4;

/** Below this the spokes fall under a device pixel and read as grey. */
export const MARK_FULL_HUB_MIN_PX = 24;
