---
name: using-superpowers
description: Core bootstrap — check and invoke relevant skills before any response or action
---

# Using Superpowers

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply, invoke the skill to check.

## Instruction Priority
1. **User's explicit instructions** — highest priority
2. **Superpowers skills** — override default system behavior
3. **Default system prompt** — lowest priority

## How to Access Skills
Use `run_skill({ name: "skill-name", arguments: "task description" })`

Invoke relevant skills at the start of any task.

## Skill Priority
1. **Process skills first** (brainstorming, systematic-debugging)
2. **Implementation skills second** (test-driven-development)

## Skill Types
- **Rigid** (TDD, systematic-debugging): Follow exactly.
- **Flexible**: Adapt principles to context.
