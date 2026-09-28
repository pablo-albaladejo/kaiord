# Design: percent_ftp to watts in the GCN writer

## Where the FTP comes from

The writer cannot know the athlete, so the FTP is an option supplied by the
caller, following the existing `paceZones` precedent: each composition root
supplies what it knows (CLI flag, MCP parameter, SPA athlete profile).

## Missing FTP is an error, not a default

A default FTP (the old docs claimed 250 W) writes targets that look valid and
are wrong, which is the bug being fixed. The writer throws a typed core error,
`MissingFtpError`, so every caller can `instanceof`-check it and turn it into
an actionable message (`--ftp`, the `ftp` parameter, "set your FTP in Athlete")
without parsing strings. A zero, negative or non-finite FTP counts as missing.

## Why the error lives in core

Callers (CLI, MCP, SPA, garmin-connect) must recognise the error without
importing the garmin adapter's internals; core already hosts the other typed
adapter errors (`UnsupportedKrdTypeError`).

## Push port

`WorkoutService.push(krd, options?)` gains an optional `PushOptions`. The
garmin-connect service builds the writer per push with the given FTP and
rethrows `MissingFtpError` as is, so it is not reported as a Garmin API
failure and no request is sent.
