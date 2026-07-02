import { z } from "zod";

/**
 * WHOOP collection envelope. Every list endpoint returns `records` plus an
 * optional `next_token` cursor; a null/absent token means the last page.
 */
export const whoopPaginatedSchema = <T extends z.ZodTypeAny>(record: T) =>
  z.object({
    records: z.array(record),
    next_token: z.string().nullish(),
  });

export type WhoopPaginated<T> = {
  records: T[];
  next_token?: string | null;
};
