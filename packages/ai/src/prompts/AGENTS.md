<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/prompts/

## Purpose

System prompt templates and template variable substitution utilities. Contains the core "workout parser" prompt that guides the LLM to convert natural language into structured KRD Workout JSON.

## Key Files

- `parse-workout.md` — System prompt template (7617 bytes): Defines workout structure (sport, steps, repetition blocks), target/duration types, zone abbreviations (FTP%, HR zones, pace zones), handling of languages (Spanish, English), ambiguity resolution
- `load-prompt.ts` — Template loader: replaces `{{variable}}` placeholders (e.g., `{{sport}}`) in raw prompt template with runtime values

## Prompt Template

The `parse-workout.md` prompt:

1. **Defines output schema**: `Workout` object with `sport`, `steps` array (mix of `WorkoutStep` and `RepetitionBlock`)
2. **Describes step anatomy**: `stepIndex`, `durationType`, `duration`, `targetType`, `target`, `intensity`, `notes`
3. **Zone abbreviations**: Interprets FTP%, HR zone numbers, pace zones (km/h, min/mile, etc.)
4. **Language handling**: Accepts Spanish, English, mixed; coach terminology (Z2, sweet spot, tempo, etc.)
5. **Ambiguity rules**: When sport is unclear, infer from context; when duration type is missing, ask; when target is missing, use sensible defaults

Variables (injected at runtime):

- `{{sport}}` — Hint for sport detection (e.g., "The sport for this workout is 'cycling'. Use it for the sport field.") or empty

## For AI Agents

### Working In This Directory

- **Update the prompt**: Edit `parse-workout.md`. Changes apply to all new LLM calls.
- **Add a variable**: Define in prompt (e.g., `{{ftp}}` for FTP hint), inject in `text-to-workout.ts` when calling `loadPrompt()`
- **Test prompt changes**: Run `pnpm --filter @kaiord/ai test:watch` to see if benchmarks pass

### Testing Requirements

- `load-prompt.test.ts`: Unit tests for `loadPrompt` variable substitution (single var, multiple vars, no vars, escaped braces)
- No tests for prompt content itself (semantic quality is validated by evals and integration tests)

### Common Patterns

- **Templating**: `loadPrompt(raw, { sport: "cycling" })` → replaces all `{{sport}}` with `"cycling"`
- **Optional vars**: If no vars passed, returns raw unchanged
- **Multi-line templates**: `.md` file imported as raw string via `import ... from "...md"` (requires `md.d.ts` type declaration)

## Dependencies

### Internal

- `../adapters/text-to-workout` — Calls `loadPrompt` to inject sport hint

### External

- None (pure TypeScript utilities)

## File Line Limits

- `load-prompt.ts`: 15 lines
- `load-prompt.test.ts`: ~30 lines

<!-- MANUAL: -->
