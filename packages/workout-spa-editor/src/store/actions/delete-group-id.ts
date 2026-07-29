/**
 * Identity for a single delete *operation*.
 *
 * Deliberately not a clock read: `Date.now()` collides whenever several
 * steps are removed inside the same millisecond, which is the normal case
 * for a bulk delete. Undo keyed on a colliding value restores one entry
 * and silently discards the rest.
 */

import { defaultIdProvider } from "../providers/id-provider";

export const newDeleteGroupId = (): string => defaultIdProvider() as string;
