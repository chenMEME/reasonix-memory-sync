---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## The Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## The Four Phases

### Phase 1: Root Cause Investigation
1. **Read Error Messages Carefully** — line numbers, file paths, error codes
2. **Reproduce Consistently** — exact steps, reliable trigger
3. **Check Recent Changes** — git diff, recent commits, new deps
4. **Gather Evidence** — trace data through component boundaries

### Phase 2: Pattern Analysis
- Find working examples, compare
- Identify the failure pattern

### Phase 3: Hypothesis and Testing
- Form specific hypothesis ("X happens because Y")
- Test minimally — change one thing, observe result

### Phase 4: Implementation
1. Create failing test reproducing the bug
2. Fix the root cause — not the symptom
3. Verify fix — test passes, no regressions

## Red Flags
- "Just try this quick fix"
- "Let me change a few things and see"
- "I've seen this before" (without verifying)
- Multiple failed fixes → STOP. Go back to Phase 1.
