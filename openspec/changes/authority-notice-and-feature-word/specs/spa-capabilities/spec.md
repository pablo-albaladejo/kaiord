## ADDED Requirements

### Requirement: The athlete reads Feature for a Capability

Every text the athlete reads SHALL call a Capability a "Feature" in English and a "Función" in Spanish, and the settings section SHALL be "Features" / "Funciones". No athlete-facing text SHALL say "Capability" or "Capacidad", except where a guard lists the exact phrase with its reason (an extension's declared data tokens, a physiological capacity); code identifiers, routes and internal docs keep "Capability".

#### Scenario: Settings in Spanish

- **WHEN** an athlete opens Settings in Spanish
- **THEN** the section SHALL read "Funciones"
- **AND** `pnpm lint:retired-terms` SHALL fail if any athlete-facing text says "Capacidad" outside its listed exceptions
