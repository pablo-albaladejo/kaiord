## ADDED Requirements

### Requirement: Outside contributors sign off their commits

`CONTRIBUTING.md` SHALL explain the Developer Certificate of Origin sign-off
in plain words. On a pull request whose author GitHub lists as none of the
repository's owner, a member or a collaborator, and who is not a bot, the
"DCO sign-off" check SHALL fail when a non-merge commit it adds has no
`Signed-off-by` line with the commit author's email. Pull requests from the
owner, the owner's agents and bots SHALL NOT be held to it.

#### Scenario: An outside contributor forgets the sign-off

- **WHEN** an outside contributor's pull request adds a commit with no `Signed-off-by` line for its author
- **THEN** the "DCO sign-off" check SHALL fail and name the commit

#### Scenario: The owner's agent opens a pull request

- **WHEN** a pull request's author is the repository's owner
- **THEN** the check SHALL pass without a sign-off
