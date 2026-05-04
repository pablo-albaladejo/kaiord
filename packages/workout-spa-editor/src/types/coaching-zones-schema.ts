/**
 * Zod schema for `ZonesPayload` — validated bridge output. Kept
 * separate from `coaching-zones.ts` (which holds the TS types).
 */
import { z } from "zod";

const minSec = z.object({
  min: z.number().int().min(0),
  sec: z.number().int().min(0).max(59),
});

const wattsBand = z.object({
  lower: z.number().int().nonnegative(),
  upper: z.number().int().nonnegative(),
});

const paceBand = z.object({ lower: minSec, upper: minSec });

const bpmBand = z.object({
  lower: z.number().int().nonnegative().max(250),
  upper: z.number().int().nonnegative().max(250),
});

const fiveBands = <T extends z.ZodTypeAny>(band: T) =>
  z.object({
    z1: band.optional(),
    z2: band.optional(),
    z3: band.optional(),
    z4: band.optional(),
    z5: band.optional(),
  });

const physiologicalSchema = z
  .object({
    weight: z.number().positive().optional(),
    bpmMax: z.number().int().positive().max(250).optional(),
    bpmRest: z.number().int().positive().max(250).optional(),
  })
  .optional();

const cyclingPacesSchema = fiveBands(wattsBand)
  .extend({
    z4Upper: z.number().int().nonnegative().optional(),
    z5Lower: z.number().int().nonnegative().optional(),
  })
  .optional();

const runSwimPacesSchema = fiveBands(paceBand)
  .extend({ z4Upper: minSec.optional() })
  .optional();

const hrSportSchema = fiveBands(bpmBand)
  .extend({ z4Upper: z.number().int().positive().max(250).optional() })
  .optional();

const hrGenericSchema = fiveBands(bpmBand).optional();

export const zonesPayloadSchema = z.object({
  physiological: physiologicalSchema,
  paces: z
    .object({
      cycling: cyclingPacesSchema,
      running: runSwimPacesSchema,
      swimming: runSwimPacesSchema,
    })
    .optional(),
  hrZones: z
    .object({
      generic: hrGenericSchema,
      cycling: hrSportSchema,
      running: hrSportSchema,
      swimming: hrSportSchema,
    })
    .optional(),
});
