## ADDED Requirements

### Requirement: The New session sheet keeps its context

When the "New session" sheet is opened with a context — a `date`, a `week`, an origin (`from`) and a sport picked on the sheet — every exit SHALL carry that context. **Blank** SHALL open the scratch editor with the date and the sport, and the editor SHALL seed the workout with that sport before the last-used sport and the default. **Import file** SHALL import onto that date and return to that date's calendar week. **Template** SHALL open the Library in picking mode for that date (`/library?source=template-picker&date=<day>`). The Library SHALL say it is picking for that day, and scheduling a template from it SHALL propose that day. A template loaded into the editor from the Library SHALL NOT trigger the draft-discard prompt meant for sheet-started drafts. **Close** on a dated sheet SHALL return to that date's calendar week and SHALL NOT reopen the sheet. A non-calendar origin SHALL be returned to instead.

#### Scenario: Blank keeps the day and the sport

- **GIVEN** the sheet was opened from a calendar day that is not today and the user picked Running
- **WHEN** the user chooses Blank, names the workout and clicks "Save & schedule"
- **THEN** the workout is stored on the chosen day with sport `running` and its card appears in that day's column

#### Scenario: Import file keeps the day

- **GIVEN** the sheet was opened from a calendar day
- **WHEN** the user chooses Import file and uploads an activity
- **THEN** the activity is stored on that day and the SPA returns to that day's calendar week

#### Scenario: Template picks for the day

- **GIVEN** the sheet was opened from a calendar day
- **WHEN** the user chooses Template and clicks Schedule on a template
- **THEN** the Library showed a hint naming that day, and the template is scheduled on that day

#### Scenario: Close returns to the week

- **GIVEN** the sheet was opened from a calendar day
- **WHEN** the user closes the sheet
- **THEN** the SPA shows that day's calendar week and the sheet is gone

### Requirement: Schedule and keep dialogs propose a value

The schedule dialog SHALL propose a date each time it opens: the caller's context date, otherwise the first day of the week in context when that week does not contain today, otherwise today. Confirming an empty or invalid date SHALL write nothing and SHALL explain why inline, with the field marked invalid. "Save & schedule" on a draft with no date SHALL open this dialog instead of writing on today. The dialog's copy SHALL be localized. The "Keep in library" dialog SHALL propose the workout's name each time it opens.

#### Scenario: An empty date is explained

- **GIVEN** the schedule dialog is open
- **WHEN** the user clears the date and confirms
- **THEN** an inline alert explains that a valid date is needed, the field is `aria-invalid`, and nothing is scheduled

#### Scenario: Keep in library proposes the name

- **GIVEN** a draft named "Tempo Tuesday"
- **WHEN** the user opens "Keep in library"
- **THEN** the name field holds "Tempo Tuesday"
