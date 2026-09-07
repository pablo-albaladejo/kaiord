## MODIFIED Requirements

### Requirement: Shared untrusted-data fence utility

`@kaiord/ai/prompts` SHALL export the untrusted-data fence utility that wraps
external text in `<<<untrusted_data>>>` markers with the existing 500-character
cap.

The utility SHALL neutralize any fence delimiter present in the text it wraps,
before wrapping, so that the payload cannot terminate its own fence. The
neutralization SHALL be closed under concatenation: it SHALL NOT be possible for
the text surrounding a neutralized delimiter to join into a valid one. The
containment obligations this serves are specified by `ai-guardrails`.

Apart from neutralization, fencing behavior as specified by `spa-ai-chat` SHALL
NOT change.

#### Scenario: Fenced output is unchanged after the move

- **GIVEN** an external coaching description carrying no fence delimiter, previously fenced by the SPA-local utility
- **WHEN** the same text is fenced through `@kaiord/ai/prompts`
- **THEN** the fenced output SHALL be identical, including markers and truncation

#### Scenario: A delimiter in the payload does not end the fence

- **GIVEN** external text containing the closing fence delimiter
- **WHEN** it is fenced
- **THEN** the output SHALL carry exactly one closing delimiter, as its final characters
