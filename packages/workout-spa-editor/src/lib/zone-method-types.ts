/**
 * Zone Method Types
 *
 * Type definitions for the zone method system.
 */

export type ZoneMethodDefault = {
  name: string;
  minPercent: number;
  maxPercent: number;
};

export type ZoneMethod = {
  id: string;
  name: string;
  zoneCount: number;
  defaults: Array<ZoneMethodDefault>;
};
