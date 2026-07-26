<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# zones

## Purpose

Coggan 7-band cycling power-zone math. Single source of truth for translating between a discrete zone (1..7) and its canonical %FTP value (55/75/90/105/120/150/200). Lives in the domain layer because it's a fitness-domain truth, not a format encoding — adapters that need fuzzy classification layer their own policy on top.

## Key Files

| File | Description |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- | --- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `power-zones.ts` | Defines `PowerZone = 1                                                                                                                                                                                 | 2   | 3   | 4   | 5   | 6   | 7`, the readonly `POWER_ZONE_PERCENT_FTP`lookup (1→55, 2→75, 3→90, 4→105, 5→120, 6→150, 7→200),`isPowerZone`type guard (rejects NaN, Infinity, non-integers, out-of-range),`zoneToPercentFtp`(RangeError on invalid), and`percentFtpToZone` (strict discrete inverse — only matches exact canonical values). |
| `power-zones.test.ts` | Tests the full round-trip identity (`percentFtpToZone(zoneToPercentFtp(z)) === z`), boundary rejection (0, 8, -1, 1.5, NaN, Infinity), and the non-classifier contract (84% does NOT round to zone 2). |

## For AI Agents

### Working In This Directory

- `percentFtpToZone` is INTENTIONALLY a discrete inverse, NOT a nearest-band classifier. Passing `84` throws `RangeError`. If an adapter needs fuzzy zone classification (e.g., "85% is roughly zone 3"), implement that policy on top — do NOT relax this contract.
- `zoneToPercentFtp` and `isPowerZone` reject `1.5`, `0`, `8`, `-1`, `NaN`, `Infinity`. Callers MUST not pre-clamp; let the RangeError surface.
- Power has 7 zones (Coggan). Heart rate and pace have 5 zones — those constraints live in the `*Value` schemas under `../schemas/target-values/`, not here.

### Testing Requirements

- Coverage target: 80%. The test file exercises every zone, every boundary, and the round-trip identity. AAA + `should ` invariants apply.

### Common Patterns

- **Strict-inverse helper** — `percentFtpToZone` deliberately throws on inputs that aren't canonical so misuse fails loudly.
- **Type guard + assertion** — `isPowerZone` narrows `number → PowerZone` for callers that want to branch; `zoneToPercentFtp` uses it internally before throwing.

## Dependencies

### Internal

None.

### External

None.

<!-- MANUAL: -->
