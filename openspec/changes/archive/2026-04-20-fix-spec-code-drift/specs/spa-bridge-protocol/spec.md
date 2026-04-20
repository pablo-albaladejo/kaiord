## ADDED Requirements

### Requirement: BridgeStatus type carries a REMOVED variant

The `BridgeStatus` discriminated union in the SPA's bridge types SHALL include a `"removed"` member in addition to `"verified"` and `"unavailable"`, so the `Bridge pruning` scenario in `Bridge lifecycle management` is representable in code without a silent `map.delete(...)` side-effect.

#### Scenario: Pruning transitions to removed and notifies the user

- **WHEN** a bridge has been in `"unavailable"` status for more than 24 hours
- **THEN** the bridge entry SHALL transition to `status: "removed"` (not be silently deleted)
- **AND** a toast notification SHALL fire once per transition informing the user that the extension has been removed from the registry
- **AND** the entry SHALL be deleted from the registry map only after the toast is dismissed by the user or 24 additional hours elapse

#### Scenario: Exhaustiveness of BridgeStatus consumers

- **WHEN** any TypeScript consumer switches on `BridgeStatus` without a `default` branch
- **THEN** the type-checker SHALL require handling of `"removed"` alongside `"verified"` and `"unavailable"` (no `never`-fallthrough allowed)
