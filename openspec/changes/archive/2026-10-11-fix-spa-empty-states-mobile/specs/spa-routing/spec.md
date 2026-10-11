## ADDED Requirements

### Requirement: The empty library offers a way to fill it

When the workout library holds no templates, its empty state SHALL offer "New workout", which opens the New session sheet at `/workout/new`, and "Import file", which opens the file import at `/workout/new?action=import`. When templates exist but the search or sport filter matches none, the empty state SHALL offer neither, since the library is not empty.

#### Scenario: First run opens the library

- **GIVEN** a library with no templates
- **WHEN** the athlete opens `#/library`
- **THEN** the page SHALL show "New workout" and "Import file", and choosing them SHALL navigate to `/workout/new` and `/workout/new?action=import` respectively

#### Scenario: A filter matches nothing

- **GIVEN** a library with templates and a search that matches none of them
- **WHEN** the empty result is shown
- **THEN** it SHALL offer no create or import action

### Requirement: Phone content clears the bottom navigation

Below the `md` breakpoint the floating bottom navigation SHALL cover no actionable content. Its geometry SHALL be defined once, as the `--bottom-nav-*` tokens, and the page's end padding SHALL be derived from them, so the last control of any page lands above the bar when scrolled to the end. In the New session sheet without a configured AI provider, the "Start from" options (Template, Blank, Import file) SHALL come before the AI setup prompt; with a provider the AI prompt SHALL come first.

#### Scenario: New session on a phone without an AI key

- **GIVEN** a 390×664 viewport, no AI provider, and the default-profile notice shown
- **WHEN** the athlete opens `#/workout/new`
- **THEN** "Template", "Blank" and "Import file" SHALL end above the bottom navigation without scrolling

#### Scenario: New session with an AI key

- **GIVEN** a configured AI provider
- **WHEN** the New session sheet opens
- **THEN** the AI prompt SHALL come before "or start from"

#### Scenario: A page taller than the screen

- **GIVEN** a 390×664 viewport and the detail view of a scheduled workout
- **WHEN** the athlete scrolls to the end
- **THEN** its footer actions SHALL end above the bottom navigation
