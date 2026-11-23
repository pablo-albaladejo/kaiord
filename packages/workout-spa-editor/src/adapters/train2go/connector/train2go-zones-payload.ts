export type Train2GoBandKey = "z1" | "z2" | "z3" | "z4" | "z5";

export type Train2GoMinSec = { min: number; sec: number };

export type Train2GoBand<T> = { lower: T; upper: T };

export type Train2GoFiveBands<T> = Partial<
  Record<Train2GoBandKey, Train2GoBand<T>>
>;

// `paces.cycling` carries WATTS (T2G names the whole form `paces`).
export type Train2GoCyclingPaces = Train2GoFiveBands<number> & {
  z4Upper?: number;
  z5Lower?: number;
};

export type Train2GoMinSecPaces = Train2GoFiveBands<Train2GoMinSec> & {
  z4Upper?: Train2GoMinSec;
};

export type Train2GoHrBands = Train2GoFiveBands<number> & {
  z4Upper?: number;
};

export type Train2GoPhysiological = {
  weight?: number;
  bpmMax?: number;
  bpmRest?: number;
};

export type Train2GoPaces = {
  cycling?: Train2GoCyclingPaces;
  running?: Train2GoMinSecPaces;
  swimming?: Train2GoMinSecPaces;
};

// `generic` is extracted by the same band reader as the sports, so it
// also carries `z4Upper`; the zones schema strips it.
export type Train2GoHrZones = {
  generic?: Train2GoHrBands;
  cycling?: Train2GoHrBands;
  running?: Train2GoHrBands;
  swimming?: Train2GoHrBands;
};

export type Train2GoZonesPayload = {
  physiological?: Train2GoPhysiological;
  paces?: Train2GoPaces;
  hrZones?: Train2GoHrZones;
};
