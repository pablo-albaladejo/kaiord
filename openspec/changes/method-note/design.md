## Context

The landing headline says every line is written by AI agents. Git records
commits and their trailers, not who typed each line, so the note can only
say what the history supports and give the commands that check it.

## Decisions

### D1. Figures pinned to one commit, tolerance 0

- **A.** Count against `HEAD`: every new commit moves every figure, so the
  guard either tolerates drift (and stops catching a wrong number) or fails
  on every push.
- **B.** Each command names the commit in the note's front matter
  (`figures_at`). Its answer never moves; recomputing the note is a
  deliberate edit of the commit and the numbers.

B is chosen. The cost: a rewritten history drops the pinned commit and the
guard fails until the note is recomputed, which is what should happen.

### D2. The guard runs the commands, without a shell

The commands are written in a public Markdown file, so the guard must not
let that file run anything but the counts. Each command is split into words
without a shell and checked against an allowlist: `git rev-list`, `git log`
and `git ls-tree` with only the options the note uses, then `grep` (`-c`,
`-v`, `-e`) and `wc -l` reading their input only. Git runs with no user or
system config and no `GIT_*` variable from a hook (see the
`truth-review-fixes` change).

### D3. A shallow clone fails with a hint, not a wrong number

The CI lint job checks out with full history. A clone without the pinned
commit fails with a fetch hint; the guard's own tests build a repository,
so `pnpm test:scripts` passes on a shallow clone.
