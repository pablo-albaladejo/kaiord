# Design: single-value bands and percent_max in the GCN writer

## Band widths

Each width is wide enough for normal moment-to-moment drift and narrow enough
to stay a target rather than a zone:

- Power uses ±5 %, which scales with the effort and roughly matches the spread
  of 3 s average power. A ±5 W floor keeps low targets usable.
- Heart rate and cadence use a fixed ±3.

The centre and the half-width are rounded separately, so a band stays
symmetric around the rounded target. Bounds are clamped to the KRD schema, so a
re-imported band still validates. The reader reads any pair back as a `range`.

## percent_max mirrors percent_ftp

The writer cannot know the athlete, so the max HR is a caller option, like
`ftpWatts`. A missing value is an error, never a default. The error lives in
core so every caller can `instanceof`-check it.

An implausible max HR is refused like a missing one, as an unusable FTP is:

- above the 300 bpm schema maximum, it would clamp to a zero-width band;
- below 100 bpm, it is a typo or a unit mix-up, not a measurement.

A target that still resolves outside 1..300 bpm (a percentage ≤ 0 or > 100) is
a KRD validation error. It is not banded.
