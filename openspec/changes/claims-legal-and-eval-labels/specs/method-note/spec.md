## ADDED Requirements

### Requirement: The note quotes the owner's statement as a declaration

The method note SHALL hold a section "The owner's statement" that quotes the
owner's statement of 2026-11-23 word for word, says it is the owner's
declaration and not a figure, and sets beside it what the history shows: the
commits before 2026-02-01 that touch `.kiro/`, and the bot commits counted
apart (Dependabot, the release bot, GitHub Actions), each a figure at the
pinned commit. The headline's register entries SHALL cite that statement and
point to the section.

#### Scenario: A reader checks the headline

- **WHEN** a reader follows the headline to the note
- **THEN** they SHALL find the owner's statement labelled as a declaration, and the figures beside it with their commands
