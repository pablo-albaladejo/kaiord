# Code Style

- TS strict; ESLint + Prettier; no implicit `any`
- Functions < 40 LOC; SRP; SOLID
- No `console.log` in libraries (inject logger if needed)
- Naming: `toKRD`, `fromKRD`, `parseX`, `writeX`
- Prefer `Array<T>` for public types
