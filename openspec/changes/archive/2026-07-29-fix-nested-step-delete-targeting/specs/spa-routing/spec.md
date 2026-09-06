## ADDED Requirements

### Requirement: Route announcer is rendered outside the application root

The route announcer SHALL be rendered into `document.body` as a sibling
of the application root element rather than as a descendant of it.

`aria-hidden`'s `hideOthers` — the mechanism Radix modal dialogs use to
remove background content from the accessibility tree — exempts
`[aria-live]` nodes together with their entire ancestor chain. An
announcer nested inside the application root therefore exempts that root
and forces the hide down onto its children, so the depth at which
background content is hidden becomes coupled to the shell's markup.
Rendering the announcer as a sibling restores a single root-level cover.

The announcer SHALL keep its `role="status"`, `aria-live="polite"` and
`aria-atomic="true"` attributes and its existing test hook, and SHALL
remain visually hidden, so this placement is observationally inert for
sighted users and unchanged for assistive technology.

The application SHALL NOT emulate this by toggling `aria-hidden` on the
application root itself, because that attribute is reference-counted by
`aria-hidden` and a manual write would leak across nested dialogs.

#### Scenario: Announcer is not a descendant of the app root

- **WHEN** the SPA shell renders
- **THEN** the route announcer SHALL be a child of `document.body` and SHALL NOT be contained by the application root element

#### Scenario: Background controls leave the accessibility tree while a dialog is open

- **GIVEN** a modal dialog is open over the application shell
- **WHEN** assistive technology enumerates controls by role
- **THEN** controls rendered behind the dialog SHALL NOT be exposed, while the dialog's own controls SHALL be

#### Scenario: Announcer keeps announcing route changes

- **WHEN** the pathname changes
- **THEN** the announcer SHALL carry the new route label and retain `aria-live="polite"` and `aria-atomic="true"`
