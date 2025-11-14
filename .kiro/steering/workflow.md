# Workflows

1. Create/Update SPEC under `.kiro/specs/<feature>/` (requirements, design, tasks)
2. Implement `domain`/`application`/`ports` first
3. Add/adjust `adapters/*` as needed
4. Add mirrored tests + golden + round‑trip
5. Run Kiro manual hooks (round‑trip, licenses)
6. Small PR; CI must be green
