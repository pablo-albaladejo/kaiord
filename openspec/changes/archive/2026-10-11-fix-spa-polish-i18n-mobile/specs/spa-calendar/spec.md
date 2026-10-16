## ADDED Requirements

### Requirement: The SPA speaks the active locale and fits a phone

Dates SHALL be formatted with `Intl` in the active locale. Text rendered by the translated surfaces SHALL come from the translation catalogue, and lint SHALL fail on JSX text that is not translated in those directories. On a phone, floating buttons SHALL NOT cover navigation or content, the header SHALL be a single row of at most 64 px, and the first run SHALL leave "New workout" and the week on the first screen. A workout SHALL download from one control, under a filename with accents transliterated, and the confirmation SHALL name the file. A trends chart SHALL span the requested window. A swim step SHALL show its pace per 100 m or 100 yd.

#### Scenario: Calendar day in Spanish

- **GIVEN** the active locale is Spanish
- **WHEN** the week list renders Monday 5 October 2026
- **THEN** its heading reads "lun, 5 oct"

#### Scenario: Phone layout

- **GIVEN** a 390 px wide viewport on the calendar
- **WHEN** the page renders
- **THEN** the "+" button does not overlap "Biblioteca", the header is at most 64 px tall and the week starts on the first screen

#### Scenario: One download control

- **GIVEN** a workout named "Rodaje auditoría"
- **WHEN** the user opens the download control and picks FIT
- **THEN** the file `rodaje_auditoria.fit` downloads and the toast reads "Downloaded as rodaje_auditoria.fit"

#### Scenario: Trends span the window

- **GIVEN** one weight entry in the last 90 days
- **WHEN** the 90-day trend renders
- **THEN** the x axis runs from the window's start to today
