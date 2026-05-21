---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

You write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** You MUST understand `test-driven-development` before using this skill.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools. Skills help future Reasonix Code instances find and apply effective approaches.

**Skills are:** Reusable techniques, patterns, tools, reference guides

**Skills are NOT:** Narratives about how you solved a problem once

## TDD Mapping for Skills

| TDD Concept | Skill Creation |
|-------------|----------------|
| **Test case** | Pressure scenario with subagent |
| **Production code** | Skill document (SKILL.md) |
| **Test fails (RED)** | Agent violates rule without skill (baseline) |
| **Test passes (GREEN)** | Agent complies with skill present |
| **Refactor** | Close loopholes while maintaining compliance |
| **Write test first** | Run baseline scenario BEFORE writing skill |
| **Watch it fail** | Document exact rationalizations agent uses |
| **Minimal code** | Write skill addressing those specific violations |
| **Watch it pass** | Verify agent now complies |
| **Refactor cycle** | Find new rationalizations → plug → re-verify |

## When to Create a Skill

**Create when:**
- Technique wasn't intuitively obvious to you
- You'd reference this again across projects
- Pattern applies broadly (not project-specific)
- Others would benefit

**Don't create for:**
- One-off solutions
- Standard practices well-documented elsewhere
- Project-specific conventions (put in project config)
- Mechanical constraints (if it's enforceable with regex/validation, automate it — save documentation for judgment calls)

## Skill Types

### Technique
Concrete method with steps to follow

### Pattern
Way of thinking about problems

### Reference
API docs, syntax guides, tool documentation

## SKILL.md Structure

```markdown
# Skill Name

## Overview
[One paragraph — what and why]

## When to Use
[Specific triggers. Be explicit.]

## The Process
[Step-by-step. Clear and concrete.]

## Red Flags
[Rationalizations this skill prevents]

## Common Mistakes
[What people get wrong]

## Quick Reference
[Cheat sheet for quick recall]
```

## Token Efficiency

Every word costs tokens. Be concise:
- Delete filler words
- Use tables for comparisons
- Use bullets over prose
- Show minimal examples, not full tutorials
- One clear message per section

## The Iron Law (Same as TDD)

```
NO SKILL WITHOUT FAILING TEST FIRST
```

Before writing a skill:
1. Dispatch a subagent to solve the problem WITHOUT the skill
2. Document exactly what goes wrong
3. Write the skill to address those specific failures
4. Re-test with the skill — verify compliance
5. Iterate until bulletproof

## Skill Creation Checklist (TDD Adapted)

**RED Phase — Baseline:**
- [ ] Dispatch subagent without skill — document failures
- [ ] Concretely: what rationalizations did agent use?
- [ ] File: save test session transcript

**GREEN Phase — Write Skill:**
- [ ] Write SKILL.md addressing each violation
- [ ] Small flowchart only if decision non-obvious
- [ ] Quick reference table
- [ ] Common mistakes section
- [ ] Red flags table

**REFACTOR Phase — Close Loopholes:**
- [ ] Identify NEW rationalizations from testing
- [ ] Add explicit counters (if discipline skill)
- [ ] Build rationalization table from all test iterations
- [ ] Re-test until bulletproof

**Quality Checks:**
- [ ] No narrative storytelling
- [ ] Supporting files only for tools or heavy reference

## The Bottom Line

**Creating skills IS TDD for process documentation.**

Same Iron Law: No skill without failing test first.
Same cycle: RED (baseline) → GREEN (write skill) → REFACTOR (close loopholes).
Same benefits: Better quality, fewer surprises, bulletproof results.
