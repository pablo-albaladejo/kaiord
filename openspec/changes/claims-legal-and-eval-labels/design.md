## Context

The claims register (`claims/README.md`) proves each public sentence with a
running test or pinned code. Some sentences the owner wants to make cannot
be proven that way: who wrote the commits before agents left trailers, and
that the project is personal. They are true by the owner's word, and the
register must say so rather than pass them off as tested.

## Decisions

### D1. An author statement is a proof kind, counted apart

`{ "author-statement": "<exact words>", "by": "the repository's owner",
"on": "YYYY-MM-DD" }`. `by` is a role from a fixed list, so no name or email
can be stored; an email anywhere in the statement is refused. A claim that
cites one is "declared" whatever else it cites: the headline keeps its
figure tests as supporting evidence, but its strength is the declaration.
Considered: a claim kind `"declared"` (like `label`/`external`). Rejected
because the statement needs its own date and author and may back several
claims (three headline entries), which is the shape of a proof.

### D2. The statement excludes bot commits

The owner's attestation is about authored work. Dependabot, the release bot
and GitHub Actions make automation commits, and the note counts them apart
(three figures). The statement therefore reads "apart from the automation
commits made by bots".

### D3. DCO only for outside contributors

GitHub's `author_association` on the pull request (none of OWNER, MEMBER,
COLLABORATOR) and `user.type` (not `Bot`) decide. No workflow told outside
contributors apart before; only bots, by actor name. Requiring a sign-off of
every commit would fail the owner's and the agents' pull requests (their
commits carry agent co-author trailers, not sign-offs) and the nightly and
release automation. Merge commits are not checked. The sign-off's email must
equal the commit author's, case-insensitively.

### D4. "Evaluated" means a passing stored result

The only store of eval results is the committed cassettes
(`packages/ai/src/evals/cassettes/committed/`), all recorded with
`claude-sonnet-5` and replayed green over every benchmark on every commit.
`EVALUATED_MODELS` lists exactly those models: a test compares the list
with the models the committed cassettes were recorded with and replays each
listed model. So today only Claude Sonnet 5 is evaluated; every OpenAI and
Google model, both Providers' defaults included, is "not evaluated".

### D5. One namer for every place a model is named

`useModelName()` (`hooks/use-model-name.ts`) gives the product name, marked
by the `models.notEvaluated` string when the model has not passed. The model
selects, the "Same as main model" and "Runs …" labels, the assistant card,
the Settings index row, the coaching progress and the usage table use it.
