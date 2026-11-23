## Context

The App calls a Provider from three places, all through `createLanguageModel`
of `@kaiord/ai/providers`: the chat agent (`hooks/chat/build-chat-agent.ts`),
workout generation (`lib/generate-workout.ts`) and lab extraction
(`application/lab/extraction/run-lab-extraction.use-case.ts`). A fourth call,
`verifyProviderKey`, sends only the key.

## Every path by which health data can reach a Provider

| Path                                                                                           | What health data                                                                                 | On "don't send"                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Chat, `query_health` tool                                                                      | sleep (with resting heart rate), weight, HRV, steps and daily calories, body composition, stress | The tool answers that the athlete chose not to share it; the message still goes |
| Chat, `query_energy_balance` tool                                                              | meals logged, energy balance and goal                                                            | Same                                                                            |
| Chat, replayed history                                                                         | earlier assistant answers of a turn that ran one of those tools may quote the values             | Those answers are left out of the replay; the athlete's own messages stay       |
| Generation (editor input, create page, coaching card, batch, the assistant's `create_workout`) | LTHR and heart-rate zones of the profile                                                         | The request goes without them; power and pace zones still go                    |
| Lab import                                                                                     | the whole lab document                                                                           | The request does not go; the results can be entered by hand                     |

Not gated, and said so: what the athlete types themselves (a chat message,
the Instructions for the AI); `get_data_routes` (which source feeds each kind,
no values); `query_workouts` and `query_coaching` (no health fields); the
results of `log_health_metric` and `log_intake` (a record id for a value the
athlete just gave). The local MCP server and the CLI run in the athlete's own
AI client and are outside the App.

## Decisions

### D1. Ask before the request, not inside a tool

A chat read tool that waited for the athlete would hold the turn past the
60 s idle watchdog of `@kaiord/ai`, which would then end it as a timeout.
So the chat asks before the turn is sent, for the kinds its tools can read: after the athlete's message is stored (it shows in the thread and nothing typed is lost) and before the agent is built.
Generation asks only when the profile holds heart-rate data (default zones
are empty, so most generations ask nothing). Lab import always asks.

### D2. Three answers; two are kept

- **Send this time**: this request only; the next one asks again. A batch
  of generations is one request; a workout the assistant creates is a
  generation of its own and asks for itself.
- **Always allow {Provider}**: kept; covers every health path to that
  Provider, so the notice lists every kind that can go, not only this one's.
- **Don't send**: kept; every path behaves as in the table above.

"Never asked again once given" holds for the two kept answers. "Send this
time" is not a standing answer, so it is asked again: the owner may prefer
it last until the App is reloaded (open question below).

### D3. Per Provider, by its type, on this device

The key is the Provider (Anthropic, OpenAI, Google), not the saved account:
a second Anthropic key reaches the same third party and asks nothing; a key
for another Provider asks for that one. The answers live in localStorage
(`kaiord-health-sharing`), the store of the device preferences: they never
ride the Drive snapshot or a backup, and "delete all data" clears them. When
storage is blocked they last the session and the App asks again next time.

### D4. One registry, the inventory drawn from it

`application/data-flows/data-flows.ts` lists every flow: its destinations,
its kinds of data and, for a health flow to a Provider, what "don't send"
does. The notice reads its kinds from the same entry; the inventory renders
every destination and every flow from it, and words each kind and each flow
from the `dataFlows` dictionary by id. A guard test fails when:

- a source file calls an outbound primitive (`createLanguageModel`,
  `verifyProviderKey`, `fetch`, the extension transport, the Umami tracker,
  the Google sign-in script) and is not declared against a flow;
- an origin in the App's content security policy is owned by no destination,
  or a destination names an origin the policy does not allow;
- an extension declares a write capability the App serves for a kind of
  data that no flow sends to that Platform, or an extension has no
  destination;
- a chat tool is neither in the health-reading set nor in the set of tools
  that read none.

### D5. The question is unsaved work

While the notice waits, the registry of unsaved work is armed, so the
update prompt holds and a silent update does not reload over it. The
dialog cannot be dismissed without an answer.

## Open questions for the owner

- The notice's wording, English and Spanish (`locales/*/dataFlows.json`).
- Whether "Send this time" should last until the App is reloaded.
- The inventory groups by destination; it could group by kind of data.
