# Coverage baseline — captured at commit 54bd8338 (pre-change)

Source: `pnpm -r --if-present run test:coverage` (exit code 0, all suites green),
totals computed from each package's `coverage/coverage-final.json`.

Gate (design D2): per-package coverage on `src/` MUST be non-decreasing at the
end of the change relative to this table.

| package            | % stmts | % branch | % funcs |
| ------------------ | ------- | -------- | ------- |
| ai                 | 98.24   | 92.13    | 100.00  |
| cli                | 90.62   | 76.96    | 88.24   |
| core               | 96.55   | 93.94    | 92.59   |
| fit                | 92.89   | 83.66    | 96.59   |
| garmin             | 97.08   | 88.89    | 90.91   |
| garmin-bridge      | 84.15   | 75.86    | 87.18   |
| garmin-connect     | 98.69   | 89.71    | 97.40   |
| mcp                | 93.26   | 83.52    | 89.84   |
| tcx                | 96.21   | 94.55    | 98.61   |
| train2go-bridge    | 81.90   | 66.33    | 70.31   |
| workout-spa-editor | 89.34   | 80.65    | 86.80   |
| zwo                | 95.11   | 88.36    | 98.94   |

Note: `garmin-bridge` and `train2go-bridge` are out of scope for this change
(no tasks touch them); their rows are recorded for completeness only.
