---
"@kaiord/cli": patch
---

Improve CLI UX with better error handling and consistency

- Add semantic exit codes: DIFFERENCES_FOUND (10) for diff command, PARTIAL_SUCCESS (11) for batch operations
- Fix diff command to use proper exit code semantics (10 = differences found, not an error)
- Add -1/-2 aliases for diff command --file1/--file2 arguments
- Validate mutual exclusivity of --output and --output-dir flags
- Separate directory creation errors from file write errors for clearer debugging
- Add actionable suggestions for common error patterns (file not found, permission denied, etc.)
- Add config file discovery logging in verbose mode for all commands
- Update validate command description to clarify FIT-only support
