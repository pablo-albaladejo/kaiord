/**
 * Branded ItemId type for stable per-item identifiers.
 *
 * Prevents accidentally mixing positional IDs (e.g. "step-0") with
 * stable UUIDs during the staged migration.
 */
export type ItemId = string & { readonly __brand: "ItemId" };

export const asItemId = (s: string): ItemId => s as ItemId;
