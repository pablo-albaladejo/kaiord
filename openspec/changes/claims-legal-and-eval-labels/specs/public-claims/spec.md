## ADDED Requirements

### Requirement: An author statement is a declared proof

A claim's proof MAY be an author statement
`{ "author-statement", "by", "on" }`: the exact words the repository's owner
states, the role stating them, and the date. `by` SHALL be a role
("the repository's owner"), never a person's name, and no field SHALL hold an
email address. A claim that cites an author statement SHALL be counted as
declared by author statement, never as proven by test or by pinned code, even
when it also cites a test. The `pnpm lint:claims` summary SHALL count
declared claims on their own.

#### Scenario: A claim rests on the owner's statement

- **WHEN** a claim's only proof is an author statement by the owner's role with a date
- **THEN** `pnpm lint:claims` SHALL pass it and count it as declared by author statement

#### Scenario: A statement names a person

- **WHEN** an author statement's `by` is a name, or a field holds an email address
- **THEN** `pnpm lint:claims` SHALL fail and say the register names no person

#### Scenario: A declared claim also cites a test

- **WHEN** a claim cites an author statement and a running test
- **THEN** the summary SHALL count it as declared, not as proven by test
