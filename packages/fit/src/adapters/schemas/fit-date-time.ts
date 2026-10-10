import { z } from "zod";

/**
 * FIT `date_time` field as it reaches the FIT -> KRD mappers.
 *
 * The @garmin/fitsdk `Decoder` converts every `date_time` field to a `Date`
 * by default (`convertDateTimesToDates: true`), already shifted from the FIT
 * epoch. Kaiord's own KRD -> FIT mappers emit Unix epoch seconds as a
 * `number`, so both shapes are accepted and normalized by `fitTimestampToIso`.
 */
export const fitDateTimeSchema = z.union([z.date(), z.number()]);

export type FitDateTime = z.infer<typeof fitDateTimeSchema>;
