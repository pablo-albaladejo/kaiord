---
"@kaiord/mcp": minor
---

`createServer(options?)` now takes `toolset` (`"local"` by default, or `"remote"`), `version`, `formatSpec`, `krdSchema` and `fitWriter`. Called with no arguments it behaves as before. The `"remote"` toolset registers only the eight stateless tools, no prompts and three resources. Its schemas have no file-path parameters, and a call that sends one fails with an error naming it. It accepts only structured workouts. Importing the server module no longer reads any file; the `kaiord-mcp` bin reads the version, the format spec and the schema at startup. `kaiord_inspect` and `kaiord_round_trip_validate` accept `input_content` (base64 for FIT), and `kaiord_diff` accepts `content1`/`format1` and `content2`/`format2`. `kaiord_convert` to FIT without `output_file` returns the FIT bytes as base64 text instead of failing.
