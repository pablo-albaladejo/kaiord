## 1. Manual sync bypass

- [ ] 1.1 In `packages/workout-spa-editor/src/components/organisms/CalendarHeader/CalendarHeader.test.tsx`, add `it("Manual Sync button bypasses staleness gate", ...)` — render with a profile linked to Train2Go and a `coachingSyncState` row whose `lastSyncedAt` is 30 seconds ago; click the per-source Sync button; assert `source.sync(profileId, weekStart)` was called once
- [ ] 1.2 Run only `packages/workout-spa-editor` tests for that file; assert pass

## 2. Coaching row preserved on convert

- [ ] 2.1 In `packages/workout-spa-editor/src/application/coaching/convert-coaching-activity.test.ts`, add `it("preserves the coachingActivities row after a successful conversion", ...)` — set up a coaching record, call `convertCoachingActivity`, assert `coaching.getByProfileAndSourceId(profileId, source, sourceId)` still returns a row equal to the original
- [ ] 2.2 Run only that file; assert pass

## 3. Convert navigation + dialog close

- [ ] 3.1 Create `packages/workout-spa-editor/src/components/molecules/CoachingCard/use-coaching-convert.test.tsx` with a hook test that mocks `useLocation` from `wouter` and `convertCoachingActivity`; assert `handleConvert` calls `navigate("/workout/<workoutId>")` and `onClose()` exactly once on success
- [ ] 3.2 Add a second `it(...)` in the same file: on `convertCoachingActivity` rejection, `error` is set and neither `navigate` nor `onClose` are called
- [ ] 3.3 Run only that file; assert pass

## 4. Sync buttons reactive to profile switch

- [ ] 4.1 In `packages/workout-spa-editor/src/components/organisms/CalendarHeader/CalendarHeader.test.tsx`, add `it("hides the Sync button when active profile has no linked accounts", ...)` — first mount with profile A (Train2Go-linked) and assert the Sync button is present; unmount; remount with profile B (no linked accounts) and assert the Sync button is absent
- [ ] 4.2 Run only that file; assert pass

## 5. Lossless userId

- [ ] 5.1 In `packages/workout-spa-editor/src/adapters/train2go/train2go-coaching-transport.test.ts`, add `it("preserves a userId larger than Number.MAX_SAFE_INTEGER as a string at the JSON parse boundary", ...)` — mock `chrome.runtime.sendMessage` to deliver a wire response with `userId: 9007199254740993`; await `t.ping()`; assert `result.externalUserId === "9007199254740993"` (string equality, not numeric)
- [ ] 5.2 Run only that file; assert pass

## 6. Concurrent disconnect aborts in-flight link

- [ ] 6.1 In `packages/workout-spa-editor/src/application/coaching/use-cases.test.ts` (existing `attemptLink` describe block), add `it("returns aborted and writes nothing when the signal is aborted mid-poll", ...)` — start `attemptLink(deps, profileId, controller.signal)`, then `controller.abort()` before the first ping resolves; assert result is `{ ok: false, reason: "aborted" }` and `profiles.getById(profileId).linkedAccounts === []`
- [ ] 6.2 Run only that file; assert pass

## 7. Wrap-up

- [ ] 7.1 Run `pnpm -r test` — all packages pass
- [ ] 7.2 Run `pnpm -r build` — all packages build
- [ ] 7.3 Run `pnpm lint` — zero warnings
- [ ] 7.4 `pnpm exec changeset` — add a `patch` changeset for `@kaiord/workout-spa-editor` noting "test: close 6 coaching test gaps from train2go-profile-link verify report"
- [ ] 7.5 `/opsx:verify` against this change to confirm all 6 scenarios are covered by tests
- [ ] 7.6 After PR merge: `/opsx:archive` (no spec sync needed — the stub spec at archive time has zero impact since no main spec is referenced)
