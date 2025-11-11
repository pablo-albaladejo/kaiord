# Focus — Quality Gates

Every interaction with Kiro MUST optimize for these three criteria. No exceptions.

## 1. Product Value (User Impact)

**Before any work begins, ask:**

- Does this solve a real user problem?
- Does it improve usability, accessibility, or functionality?
- Is it scalable and extensible?

**Requirements:**

- Every spec MUST include explicit user value justification
- Every feature MUST have measurable success criteria
- Reject work that doesn't clearly address user needs
- API design MUST prioritize developer experience (DX)
- Error messages MUST be actionable and clear
- Documentation MUST be complete before implementation

**For Kaiord specifically:**

- Round-trip conversions MUST be lossless (within tolerances)
- Schema validation MUST provide helpful error messages
- CLI output MUST be clear and parseable
- Library API MUST be intuitive and well-typed

## 2. Kiro Integration (Process Excellence)

**Mandatory Kiro usage per milestone:**

- Specs: requirements → design → tasks workflow
- Hooks: automated validation (schema, tests, round-trip)
- Steering: enforce architecture and code quality
- Vibe coding: iterative refinement with AI

**Documentation requirements:**

- Every Kiro feature used MUST be documented in commit/PR
- Explain WHY each capability was chosen
- Demonstrate WHAT benefit it provides
- Show HOW it improves the workflow

**Traceability:**

- Every task MUST reference a spec
- Every implementation MUST reference requirements
- Every test MUST reference acceptance criteria
- Every PR MUST show Kiro-driven reasoning

## 3. Code Quality (Craft & Polish)

**Non-negotiable standards:**

- No `any` types without explicit justification
- No `console.log` in library code
- No placeholder comments ("TODO", "FIXME") in main branch
- No untested code paths for core functionality
- Functions < 40 LOC; refactor if larger
- Test coverage ≥ 80% (mappers/converters ≥ 90%)

**Architecture compliance:**

- Domain layer MUST NOT import external libs
- Application layer MUST NOT import adapters
- Ports MUST define clear contracts
- Adapters MUST be swappable via DI

**Polish requirements:**

- Error handling MUST be comprehensive
- Edge cases MUST be documented and tested
- Performance MUST be measured for critical paths
- Memory leaks MUST be prevented (no circular refs)

## Enforcement Checklist

### During Spec Creation

- [ ] User value clearly articulated
- [ ] Success criteria defined and measurable
- [ ] Kiro workflow documented (which features, why)
- [ ] Architecture compliance verified
- [ ] Testing strategy defined

### During Implementation

- [ ] Code follows all steering rules
- [ ] Tests written and passing (coverage targets met)
- [ ] No type safety violations
- [ ] No architectural violations
- [ ] Kiro hooks passing (schema, round-trip, etc.)

### During Review

- [ ] User value delivered as specified
- [ ] Kiro integration documented
- [ ] Code quality standards met
- [ ] All tests passing
- [ ] Documentation complete

## Rejection Criteria

**Automatically reject work that:**

- Lacks clear user value justification
- Violates hexagonal architecture boundaries
- Has < 80% test coverage (< 90% for converters)
- Contains `any` types without justification
- Fails schema validation
- Fails round-trip tests
- Has no corresponding spec
- Uses Kiro features without documenting why

## Priority Order

When conflicts arise, prioritize in this order:

1. **Correctness** (round-trip safety, schema validation)
2. **User value** (DX, error messages, documentation)
3. **Architecture** (hexagonal, DI, ports/adapters)
4. **Polish** (performance, edge cases, error handling)
5. **Process** (Kiro integration, traceability)

This ensures we never sacrifice correctness for speed, but always maintain high standards across all dimensions.
