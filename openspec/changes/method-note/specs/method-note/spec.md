## ADDED Requirements

### Requirement: A public note explains how Kaiord is built

The docs site SHALL publish `/docs/project/how-kaiord-is-built`, from
`packages/docs/project/how-kaiord-is-built.md`. It SHALL explain how agents
build the project, what a person does, and how a reader checks both against
the public history, and SHALL state what the history supports and what it does
not. It SHALL name no individual other than through the commands that count
commits. Every unit of text on it SHALL be registered in `claims/method.json`.

#### Scenario: A reader follows the headline

- **WHEN** a reader opens the note from the landing
- **THEN** they SHALL find the headline quoted, the narrower statement the history supports, and the commands that check it

#### Scenario: A sentence is added to the note

- **WHEN** a paragraph with no entry in `claims/method.json` is added to the note
- **THEN** `pnpm lint:claims` SHALL fail and quote it

### Requirement: Every figure on the note is reproduced by its stated command

Each figure SHALL be a table row `| figure | value | command |`. The note's
front matter SHALL pin a commit (`figures_at`), and every command SHALL name
that commit and be a pipeline of `git`, `grep` and `wc` only.
`scripts/check-method-figures.mjs` (`pnpm lint:method-figures`, part of
`pnpm lint`) SHALL rerun each command from the repository root and fail when
its output differs from the stated value (tolerance 0). Because every command
names a fixed commit, a new commit SHALL never change a figure.

#### Scenario: A figure drifts

- **WHEN** a value on the note differs from its command's output
- **THEN** `pnpm lint:method-figures` SHALL fail and name the figure, the stated value and the computed one

#### Scenario: A command follows the moving history

- **WHEN** a command does not name the pinned commit
- **THEN** `pnpm lint:method-figures` SHALL fail before running it

#### Scenario: A command is not a plain pipeline

- **WHEN** a command chains, redirects, substitutes or pipes into anything other than `git`, `grep` or `wc`
- **THEN** `pnpm lint:method-figures` SHALL refuse it without running it

#### Scenario: The clone lacks the pinned commit

- **WHEN** the pinned commit is not in the clone (a shallow clone, or a rewritten history)
- **THEN** `pnpm lint:method-figures` SHALL fail and say the figures need full history; its tests SHALL still pass, because they build their own git repository
