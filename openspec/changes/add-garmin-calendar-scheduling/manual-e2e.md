# Manual E2E runbook (AC-47, task 9.4)

Six checks against a real Train2Go week on the athlete's own Garmin account.
They confirm on the real services what the unit and Playwright suites prove
against fakes, and they check assumption A6 (Train2Go keeps the `sourceId`
when a coach moves a session).

## Never paste credentials

Never paste cookies, CSRF tokens, bearer tokens, `Authorization` headers,
HAR files or copied network requests anywhere: not in `tasks.md`, not in an
issue, not in a chat. Evidence is **screenshots, dates and Garmin ids only**.
Before saving a screenshot, check that no DevTools request headers are in
the frame.

## Before you start

1. Run the SPA from this branch.
2. Load the Kaiord Garmin Bridge from this branch as an unpacked extension.
   - Its ping must report `calendar-write-v1` and `calendar-find-v1`.
   - With an older bridge, every send is library-only and the checks below
     do not apply.
3. Sign in to Garmin Connect in the same browser.
4. In Kaiord → Connections, turn on sending workouts to Garmin.
5. Pick a Train2Go week in the future with 5–7 sessions. Sync it and convert
   its sessions into workouts, so each one is ready to send.
   - A future week lets the coach move a session in check 4.
6. Note the week's Monday date. You will paste it with the evidence.

## Checks

### 1. Bulk send places the week

1. Open the week in Kaiord's calendar and choose **Send week**.

Expected:

- Every session in the panel reads **On its date**, and the summary reads
  **Placed: N**, where N is the number of sessions.
- In the Garmin Connect calendar, each session is on its date, exactly once.
- After a watch sync, each session is on the watch's calendar on its date.

Evidence:

- A screenshot of the panel.
- A screenshot of the Garmin Connect calendar week.
- A photo of the watch calendar.
- One line per session: its date and its Garmin workout id (the digits in
  the Garmin Connect workout URL).

### 2. An unchanged re-send adds nothing

1. Without changing anything, choose **Send week** again.

Expected:

- Every item reads **Already on its date**.
- The Garmin Connect calendar still has exactly one entry per session.

Evidence:

- A screenshot of the panel.
- The count of entries per date.

### 3. A date move leaves one entry

1. In Kaiord, move one sent workout to another day of the week.
2. Open it and choose **Send to Garmin**.

Expected:

- The page reads **Moved on your Garmin calendar to** the new date.
- In Garmin Connect, the workout is on the new date only.

Evidence:

- A screenshot of the message.
- The old date, the new date, and the entry count on each (0 and 1).

### 4. A coach move leaves one entry (checks A6)

1. Have the coach move one sent session, one the athlete did not move in
   check 3, to another day in Train2Go.
2. In Kaiord, sync the week.

Expected:

- The calendar shows the notice **1 session moved to the coach's new
  date.**
- The workout is on the coach's new date.
- **Send to Garmin** on that workout reads **Moved on your Garmin calendar
  to** the new date.
- In Garmin Connect, the workout is on the new date only.

Record A6:

- **A6 holds** if the moved session stays the same workout (same Kaiord
  page, same Garmin workout id) and the notice appears.
- **A6 is false** if the old workout disappears and a new one appears
  instead (a delete and a create).
  - Record this as the known limitation.
  - Remove any entry left on the old date by hand in Garmin Connect.

Evidence:

- A screenshot of the notice.
- The old and new dates, the Garmin workout id before and after, and the
  entry count on each date.
- The A6 verdict.

### 5. Offline during the schedule, then retry: no duplicate

The schedule request runs in the extension's service worker. Throttling the
page in DevTools does not reach it.

1. Move one sent workout to another day. Its next send then makes only the
   calendar calls, with no library push.
2. Open `chrome://extensions`. On the Kaiord Garmin Bridge, open **service
   worker** to get its DevTools. In that window's Network tab, set
   **Offline**.
3. In Kaiord, open the workout and choose **Send to Garmin**.
4. Set the service worker back to **No throttling**.
5. Follow what the page says:
   - "Still checking Garmin. You can answer in N s": wait for the countdown.
     Then choose **Send anyway**, or **It's in Garmin** if the entry is
     already there.
   - "Garmin is still processing the last send": wait a minute, then send
     again.
   - Otherwise, send again.

Expected:

- Exactly one entry for the workout, on its new date.
- Nothing is left on the old date, and there are no duplicates.

By hand you cannot choose whether the request dies before or after Garmin
receives it. The case where Garmin receives the request but the answer is
lost is covered by `garmin-calendar-ambiguity.spec.ts`. This check confirms
the retry path on the real account.

Evidence:

- Screenshots of the message after the offline send and after the retry.
- The entry count on the old date and on the new date.

### 6. Two tabs sending at once: one is busy

1. Open the same workout's page in two tabs. Pick a workout that is not in
   the Garmin library yet, or one moved since its last send, so the send
   takes long enough to overlap.
2. Choose **Send to Garmin** in the first tab, then at once in the second.
   - If the first send ends too quickly, throttle the service worker to
     **Slow 3G** as in check 5.

Expected:

- The second tab reads **This workout is already being sent. Try again once
  that send ends.**
- In Garmin Connect, the workout has exactly one entry.

Evidence:

- A screenshot of each tab.
- The entry count for the workout's date.

## Cleanup

1. In Garmin Connect, delete the calendar entries created for the test week,
   unless the athlete keeps them for training.
2. Delete the library workouts the test created, if they are not wanted.
3. Delete the stray **Run Workout (13)** library workout if it is still
   there.
4. Put the service worker's throttling back to **No throttling**.
5. Record each deleted entry's date and Garmin id with the evidence.

## Evidence template for `tasks.md` (under 9.4)

```markdown
Manual E2E, <YYYY-MM-DD>, week of <Monday YYYY-MM-DD>, bridge <version>:

1. Bulk: <N> sessions placed. <date → Garmin workout id, one per line>.
   Watch: yes/no. Screenshots: <names>.
2. Re-send: all "Already on its date"; entries per date <counts>.
3. Date move: <old> → <new>; entries <old: 0, new: 1>.
4. Coach move: <old> → <new>; workout id <before> / <after>; entries
   <old: 0, new: 1>; notice shown: yes/no. A6: holds / false.
5. Offline retry: message <which>; entries <old: 0, new: 1>.
6. Two tabs: second tab busy: yes/no; entries <1>.
   Cleanup: <deleted entries and library workouts: date + id>.
   "Run Workout (13)": deleted / not present.
```
