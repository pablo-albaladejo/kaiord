## MODIFIED Requirements

### Requirement: Session connection flow

The connect flow for Train2Go SHALL live on the **Train2Go card of the Connections page** (`/connections`, see `spa-connections-page`), not on the calendar. The profile manager SHALL NOT carry a Linked Accounts surface.

When a profile has no `train2go` linked account and the extension is present, the Train2Go card SHALL offer to link it. Clicking it SHALL invoke the application-layer use case `attemptLink(targetProfileId, signal)`. The handler SHALL:

1. Capture `targetProfileId = activeProfileId` synchronously at click time.
2. Create an `AbortController` and pass its signal to `attemptLink(targetProfileId, signal)`.
3. Send `{ action: "open-train2go" }` to open the Train2Go app.
4. Poll every 2s (up to 5 attempts) by reading Train2Go's profile ping raw through the thin Bridge (`{ action: "request", method: "GET", path: "/api/v2/profile/ping" }`) until the Connector reads a live session from it. Each poll iteration SHALL check `signal.aborted` and abort cleanly if set. The connection check `ping` answers only yes or no and SHALL NOT be used to link; an extension on the previous protocol is asked through its `ping`, which still carries the profile.
5. Once the session is live, capture `userId` (as a string from the JSON parse boundary) and `userName` from that answer; the coach's name and notes in it are dropped by the Connector.
6. Call `linkAccount(targetProfileId, { source: "train2go", externalUserId, externalUserName, linkedAt: now })`. The use case takes `targetProfileId` as an explicit argument; it MUST NOT resolve the profile via `getActiveId()` at write time. If `getById(targetProfileId)` returns `undefined` (profile deleted between click and poll completion), the use case throws `ProfileNotFoundError`; the caller surfaces a toast "Profile no longer exists; not linked." and writes nothing.

If the active profile changes during the poll, the link still completes against `targetProfileId` (the user's intent at click time wins) and a small toast surfaces "Linked Train2Go to <targetProfileName>" so the user is not surprised.

The poll SHALL be aborted (and no link written) when:

- The surface hosting the connect flow unmounts.
- The user explicitly cancels the connect flow.

<!-- The prior list also aborted the poll when the user disconnected the same
source mid-poll. On the Connections card the unlink control is offered only
once a link exists, and the poll runs only while none does, so that state is
unreachable and its scenario is removed with it. -->

On abort, no toast is shown and `lastError` is not set — abort is a silent, intentional state.

The calendar SHALL NOT host a Connect button. If the active profile has no linked accounts and the user attempts a sync, the calendar SHALL surface a hint pointing to the Connections page.

#### Scenario: One-click Train2Go connection

- **WHEN** the user links Train2Go from its card on the Connections page
- **THEN** the extension opens a Train2Go tab, the SPA polls until the session is active, and the active profile gains a `train2go` entry in `linkedAccounts`

#### Scenario: The link comes from the profile read

- **WHEN** the connect flow polls an extension that answers `ping` with yes or no only
- **THEN** it sends `request` for `/api/v2/profile/ping`, never `ping`, and links the `userId` and `userName` the Connector reads from the answer

#### Scenario: Connection polling times out

- **WHEN** the SPA polls 5 times without `sessionActive: true`
- **THEN** the SPA shows guidance inside the panel: "Open Train2Go, log in, and try again"

#### Scenario: Profile switch mid-poll preserves intent

- **WHEN** the user clicks "Connect Train2Go" while Profile A is active, then switches to Profile B before polling completes successfully
- **THEN** the link is written to Profile A (the captured `targetProfileId`), Profile B's `linkedAccounts` is untouched, and a toast surfaces "Linked Train2Go to <Profile A name>"

#### Scenario: Connect aborted by leaving the surface

- **WHEN** the user starts linking Train2Go and the surface hosting the connect flow unmounts before polling succeeds
- **THEN** the `AbortSignal` fires, polling stops, no `linkAccount` is invoked, no toast is shown, and `lastError` remains unchanged

#### Scenario: Connect on deleted profile fails cleanly

- **WHEN** Profile A is the connect target, Profile A is deleted in another tab during the poll, and the poll then succeeds
- **THEN** `linkAccount(A, ...)` throws `ProfileNotFoundError`; a single toast surfaces "Profile no longer exists; not linked"; no `linkedAccounts` row exists anywhere

#### Scenario: Unlink from the Connections card

- **WHEN** the user unlinks the Train2Go account from its card on the Connections page
- **THEN** the entry is removed from `linkedAccounts`. Persisted `coachingActivities` rows for that profile remain on disk (they are coach-owned data, retained until explicit profile deletion).

#### Scenario: Disconnect retains historical coaching activities

- **WHEN** Profile P had a `train2go` link with N persisted activities, the user clicks Disconnect, and then re-renders the calendar
- **THEN** the N activities continue to appear (read from `coachingActivities`); only profile deletion fully purges them. A user wanting full purge must delete the profile.
