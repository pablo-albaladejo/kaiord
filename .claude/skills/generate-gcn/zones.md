# Training Zones

Override this file with your personal zones. These are used by the generate-gcn skill to calculate pace/power targets.

## Running Pace Zones (13-01-2025)

| Zone | Min (min/km) | Max (min/km) | Min (m/s) | Max (m/s) | %VAM |
|------|-------------|-------------|-----------|-----------|------|
| Z1 | 6:34 | 5:50 | 2.54 | 2.86 | 50-59 |
| Z2 | 5:49 | 5:25 | 2.86 | 3.08 | 60-69 |
| Z3 | 5:24 | 4:45 | 3.08 | 3.51 | 70-79 |
| Z4 | 4:44 | 4:10 | 3.51 | 4.00 | 80-89 |
| Z5 | 4:09 | 3:30 | 4.02 | 4.76 | 90-100 |

## Swimming Pace Zones (23-08-2025)

| Zone | Min (min/100m) | Max (min/100m) | Min (m/s) | Max (m/s) | %VAM |
|------|---------------|---------------|-----------|-----------|------|
| Z1 | 2:20 | 1:59 | 0.71 | 0.84 | 50-59 |
| Z2 | 1:58 | 1:48 | 0.85 | 0.93 | 60-69 |
| Z3 | 1:48 | 1:40 | 0.93 | 1.00 | 70-79 |
| Z4 | 1:39 | 1:32 | 1.01 | 1.09 | 80-89 |
| Z5 | 1:31 | 1:26 | 1.10 | 1.16 | 90-100 |

## Cycling Power Zones (10-11-2025)

| Zone | Min (W) | Max (W) | %FTP |
|------|---------|---------|------|
| Z1 | 111 | 143 | 50-59 |
| Z2 | 144 | 198 | 60-69 |
| Z3 | 199 | 229 | 70-79 |
| Z4 | 230 | 259 | 80-89 |
| Z5 | 260 | 386 | 90-100 |

## How to Override

Replace the values above with your own training zones. The generate-gcn skill reads this file to calculate targets for steps described with zone references (Z1, Z2, etc.) or qualitative terms (easy, progressive, max effort).

### Derived Values

- **FTP estimate**: ~260W (Z5 min)
- **Easy/Recovery pace**: Z1 range (6:34-5:50/km)
- **"Progresivo"**: range spanning from current zone min to next zone max
- **"A tope"**: Z5 range
