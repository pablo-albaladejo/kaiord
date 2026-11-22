---
status: accepted
---

# KRD is the internal canonical model, not FIT

Every format adapter converts to and from KRD, a JSON model owned by Kaiord, instead of using FIT as the hub. FIT is binary and controlled by Garmin; we wanted a model that is human-readable, validated by a schema we own, and that a person or a language model can read and write directly. FIT meets none of those three.

KRD is an internal model. It is not offered to third parties as an open standard, and no compatibility promise is made to anyone outside the Kaiord SDK beyond the semver of its packages.

## Considered Options

- **FIT as the hub**: rejected for the reasons above, even though it is the most complete format and the one devices consume.
- **KRD as a public interchange standard**: rejected. There are no external adopters, and the commitment to stability and specification it implies is not one the project wants to carry.

## Consequences

- A major version of an SDK package is released only when KRD or a package's public API changes incompatibly.
- Round-trip is claimed per format, and only where a test proves it within the declared tolerances.
