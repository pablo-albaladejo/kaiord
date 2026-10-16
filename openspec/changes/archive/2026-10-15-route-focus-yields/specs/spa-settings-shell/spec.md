## MODIFIED Requirements

### Requirement: Changing section resets the scroll position

When the open section changes, the shell SHALL return the document scroll to the
top, so a section is never entered already scrolled to the offset the previous
one left behind. The reset SHALL NOT run on the first render, so a deep link
that also asks for a sub-section anchor is scrolled by the anchor rather than
fought by the reset. A change that only alters the sub-section query SHALL NOT
reset the scroll. The reset SHALL be a jump, never an animated scroll, whatever
the document's `scroll-behavior`: a section still gliding once it has opened
moves under a press, and the release lands on another element.

#### Scenario: Moving between sections returns to the top

- **GIVEN** a section scrolled away from the top
- **WHEN** a different section is opened
- **THEN** the document scroll SHALL be reset to the top

#### Scenario: The reset jumps instead of gliding

- **GIVEN** a section scrolled away from the top under `html { scroll-behavior: smooth }`
- **WHEN** a different section is opened
- **THEN** no animation frame SHALL show a scroll offset between the previous one and the top

#### Scenario: Closing a section returns to the top

- **GIVEN** a section scrolled away from the top
- **WHEN** the shell returns to the index
- **THEN** the document scroll SHALL be reset to the top

#### Scenario: A first render is left alone

- **GIVEN** a scroll offset already applied when the shell mounts
- **WHEN** the shell renders for the first time
- **THEN** the scroll offset SHALL be left unchanged
