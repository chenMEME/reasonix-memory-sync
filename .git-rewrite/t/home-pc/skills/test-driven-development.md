---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

## Red-Green-Refactor

### RED — Write Failing Test
Write one minimal test showing what should happen.

### Verify RED — Watch It Fail
Run the test. Confirm it fails for the EXPECTED reason.

### GREEN — Minimal Code
Write the absolute minimum code to pass. No more.

### Verify GREEN — Watch It Pass
Run ALL tests. Previous tests must still pass.

### REFACTOR — Clean Up
Remove duplication, improve names, simplify. Run tests after each change.

## Good Tests
- **Test behavior, not implementation**
- **One concept per test**
- **Real code over mocks**
- **Edge cases and errors** — not just happy path

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's too simple to test" | Tests prevent regression |
| "I'll add tests later" | Later never comes |
| "Just this one time" | One exception becomes habit |

## Final Rule
```
Production code → test exists and failed first
Otherwise → not TDD
```
