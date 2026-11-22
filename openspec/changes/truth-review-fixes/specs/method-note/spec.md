## ADDED Requirements

### Requirement: The figures guard runs no shell

`scripts/check-method-figures.mjs` SHALL split each command into words
without a shell, allow only `git rev-list`, `git log` and `git ls-tree` with
the options the note uses followed by `grep` (`-c`, `-v`, `-e`) and `wc -l`
reading their input, refuse `-c`, `--output`, `-o`, `--exec`,
`--upload-pack`, `--git-dir`, `--work-tree`, `-C`, `--config-env`, aliases,
`ext::`, grep's `-f`, `-r` and `--include`, file operands and any path outside
the repository, and run git with no user or system config.

#### Scenario: A command carries a git alias

- **WHEN** a figure's command is `git -c alias.x='!echo PWNED' x <sha> | wc -l`
- **THEN** the guard SHALL refuse it before anything runs

#### Scenario: A command writes a file

- **WHEN** a figure's command is `git log --output=/tmp/x <sha> | wc -l`
- **THEN** the guard SHALL refuse it and no file SHALL be written
