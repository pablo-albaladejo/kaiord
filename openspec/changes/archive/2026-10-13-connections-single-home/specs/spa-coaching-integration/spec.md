## MODIFIED Requirements

### Requirement: LinkedCoachingAccount domain semantics

A `Profile` SHALL be able to carry zero or more `LinkedCoachingAccount` entries, each shaped as `{ source: string, externalUserId: string, externalUserName: string, linkedAt: string (ISO datetime) }`. At most one entry per `source` per profile MUST exist.

The `source` field is compared **case-sensitively** as a canonical lowercase ASCII identifier (`"train2go"`, future: `"trainingpeaks"`). All mappers MUST emit the canonical form; uniqueness is enforced on the literal string. A typo or differently-cased input does NOT match an existing entry — the caller is responsible for normalization.

`externalUserId` SHALL be stored as `string`. The platform-specific transport adapter SHALL produce that string at the JSON parse boundary (never `String(parsedNumber)` after the fact, which is lossy for integers above `Number.MAX_SAFE_INTEGER`).

Linking SHALL be performed by an explicit application-layer use case `linkAccount(profileId, account)` whose `profileId` argument is captured by the caller at user-action time (e.g., when the user clicks "Connect"). The use case MUST NOT resolve the target profile via `getActiveId()` at write time — that would race with profile switches mid-poll. Re-linking the same `source` on the same profile replaces the previous entry. Unlinking is performed by `unlinkAccount(profileId, source)`.

#### Scenario: Profile starts with no linked accounts

- **WHEN** a new Profile is created
- **THEN** `linkedAccounts` is initialized to `[]`

#### Scenario: Linking a coaching source

- **WHEN** the user links a Train2Go account to Profile P from the Train2Go card on the Connections page
- **THEN** `linkAccount(P, { source: "train2go", externalUserId, externalUserName, linkedAt })` is invoked and P gains exactly that entry in `linkedAccounts`

#### Scenario: Linking a second source on the same profile

- **WHEN** Profile P already has a `train2go` linked account and the user links a different source (future: `trainingpeaks`)
- **THEN** both entries coexist in `linkedAccounts`

#### Scenario: Re-linking the same source replaces the prior entry

- **WHEN** Profile P already has a `train2go` entry and the user links a different Train2Go account
- **THEN** the previous `train2go` entry is replaced (uniqueness invariant — one entry per source per profile)

#### Scenario: Profile switch mid-link preserves user intent

- **WHEN** the user starts the connect flow under Profile A and switches the active profile to B before polling completes
- **THEN** `linkAccount(A, ...)` is invoked with the originally captured `targetProfileId = A`, and B's `linkedAccounts` is untouched

#### Scenario: Unlinking a coaching source

- **WHEN** the user unlinks the Train2Go account from its card on the Connections page while Profile P is active
- **THEN** `unlinkAccount(P, "train2go")` is invoked and the entry is removed from P's `linkedAccounts`

#### Scenario: linkAccount on a deleted profile fails cleanly

- **WHEN** `linkAccount(P, account)` is called and `ProfileRepository.getById(P)` returns `undefined` (P was deleted between the connect-flow click and the poll completion)
- **THEN** the use case throws `ProfileNotFoundError`; no partial state is written to any profile, and the caller is responsible for surfacing a user-facing toast

#### Scenario: unlinkAccount is idempotent

- **WHEN** `unlinkAccount(P, "train2go")` is called and EITHER `P` no longer exists OR `P` has no `train2go` entry in `linkedAccounts`
- **THEN** the use case completes silently (no error thrown, no toast). Disconnect is the user's intent to be in the unlinked state — if the state already satisfies that intent, the use case is a no-op.

#### Scenario: Disconnect after a successful link

- **WHEN** a connect poll resolved and wrote a `train2go` entry to Profile P, and the user then immediately clicks Disconnect
- **THEN** `unlinkAccount(P, "train2go")` runs and removes the entry. The disconnect handler MUST detect that the link was already written (poll not aborted) and run unlink, NOT skip it.

### Requirement: Calendar Sync button gated on linked account

The calendar header SHALL render a "Sync <Label>" button for each linked coaching account on the active profile. If the active profile has no linked account for a given source, no Sync button for that source SHALL appear.

When the active profile has zero linked accounts, the calendar SHALL display a contextual hint pointing to the **Connections page** as the place to connect — never an inline Connect action.

#### Scenario: Profile with linked Train2Go shows Sync button

- **WHEN** the active profile has `linkedAccounts: [{ source: "train2go", ... }]`
- **THEN** the calendar header shows a "Sync Train2Go" button

#### Scenario: Profile with no linked accounts hides Sync buttons

- **WHEN** the active profile has `linkedAccounts: []`
- **THEN** the calendar header shows no Sync buttons but instead surfaces a hint linking to the Connections page

#### Scenario: Profile switch updates Sync buttons

- **WHEN** the user switches from a profile with Train2Go linked to one without
- **THEN** the "Sync Train2Go" button disappears without page reload
