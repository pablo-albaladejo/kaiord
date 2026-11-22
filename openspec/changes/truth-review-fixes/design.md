## Context

The review found ways to pass the claims and method-figures guards without
the claim being true, and public texts outside the register.

## Decisions

### D1. Parse, do not sanitise

- **A.** Keep the shell and widen the blocklist of characters and options.
  Every git option that writes, runs or redirects (`-c`, `--output`,
  `--exec`, `--upload-pack`, aliases, `ext::`…) would have to be known.
- **B.** No shell: split the command into words (single quotes only, any
  character sh would treat as code refused), allow only the subcommands and
  options the note uses, and spawn each stage with its argv.

B is chosen. The named options are also refused by name, so the error says
why.

### D2. Mask the source rather than parse it

A test proof must be a real call. Parsing JavaScript and TypeScript would
need a dependency the guards do not take. Blanking comments, strings,
templates and regex bodies to spaces (same length) leaves only code to
search, and paren matching on the mask finds each `describe` around a test.

### D3. Count per register, not per surface

Multiplicity compares the times a text appears across one register's
surfaces with the entries for it. A sentence that is the same claim each time
(the title in `<title>`, `og:title` and `twitter:title`) declares `count`;
a different claim with the same text gets its own entry.

### D4. Labels carry no proof

- **A.** Let a label keep pointing to its own surface: it then looks proven.
- **B.** A label is declared and carries none, so the summary separates what
  states nothing from what is proven.

B is chosen. A label is text with no factual content; when in doubt, it is a
claim. A claim proven only by its own surface, a file existing or an endpoint
fails.

### D5. External claims expire

A quote of a Platform's terms or of Chrome's documentation is proven only by
reading it. Such an entry names the URL and the date read and fails after 180
days.

### D6. The data statement is tied to the content security policy

The policy is the complete list of remote origins a page may reach. A test
maps each origin to the destination the statement names, so a new origin
fails until the statement says where the data goes.

### D7. Retired terms in one list

The words are in `scripts/retired-terms.vocab.mjs`, each with its reason,
with an allowlist of exact phrases. The rest of the glossary's _Avoid_ lists
wait for #1646 and #1661: the extensions are still named "… Bridge".
