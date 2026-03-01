---
name: garmin-push
description: Push a GCN workout file to Garmin Connect. Use when the user wants to upload/push/send a workout to Garmin Connect.
argument-hint: <file.gcn> [--email user@mail.com --password pass]
allowed-tools: Bash
---

Push a `.gcn` workout file to Garmin Connect via the Kaiord CLI.

## Instructions

1. **Parse arguments** from `$ARGUMENTS`:
   - First positional value → GCN file path (required)
   - `--email` or `-e` → Garmin Connect email (optional)
   - `--password` or `-p` → Garmin Connect password (optional)

2. **Verify the GCN file exists** before attempting any operation.

3. **Try to push directly** (stored tokens from a previous session may still be valid):

```bash
pnpm --filter @kaiord/cli dev -- garmin push -i <FILE> --json
```

4. **If push fails with auth error** and credentials were provided, login first then retry:

```bash
pnpm --filter @kaiord/cli dev -- garmin login -e <EMAIL> -p <PASSWORD> --json
pnpm --filter @kaiord/cli dev -- garmin push -i <FILE> --json
```

5. **If push fails and no credentials were provided**, tell the user:
   > Not authenticated. Provide credentials: `/garmin-push file.gcn -e user@mail.com -p password`

## Output

Parse the JSON output from the push command and show a summary:

| Field   | Value                |
| ------- | -------------------- |
| Name    | workout name         |
| ID      | workout id           |
| URL     | Garmin Connect link  |

## Notes

- Tokens are persisted to `~/.kaiord/garmin-tokens.json` after login, so subsequent pushes skip authentication automatically.
- The CLI auto-detects `.gcn` format from the file extension.
- The push command also accepts other formats (`.krd`, `.fit`, `.tcx`, `.zwo`) via `--input-format`.
