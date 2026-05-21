---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session — dispatches fresh subagent per task with two-stage review
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

**Continuous execution:** Do not pause to check in with your human partner between tasks. Execute all tasks from the plan without stopping. The only reasons to stop are: BLOCKED status you cannot resolve, ambiguity that genuinely prevents progress, or all tasks complete. "Should I continue?" prompts and progress summaries waste their time — they asked you to execute the plan, so execute it.

## When to Use

- You have a written implementation plan
- Tasks are mostly independent
- You're staying in this session (not dispatching to parallel session)

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Two-stage review after each task: spec compliance first, then code quality
- Faster iteration (no human-in-loop between tasks)

## The Process

### Initial Setup

1. Read the implementation plan file with `read_file`
2. Extract all tasks with full text — note context, dependencies
3. Create `todo_write` tracking for each task
4. For each task, note: task description, files involved, dependencies

### Per-Task Loop

For each task in order:

1. **Dispatch implementer subagent** via `run_skill`:
   ```
   run_skill({
     name: "implementer-prompt",
     arguments: "Task N: [task name]
   
   ## Task Description
   [FULL TEXT of task from plan — paste it here, don't make subagent read file]
   
   ## Context
   [Scene-setting: where this fits, dependencies, architectural context]
   
   Work from: [directory path]"
   })
   ```

2. **If implementer asks questions:** Answer clearly and completely. Don't rush them into implementation.

3. **Implementer self-reviews, implements, tests, commits, and reports back.**

4. **Dispatch spec reviewer subagent** via `run_skill`:
   ```
   run_skill({
     name: "spec-reviewer-prompt",
     arguments: "Task N: [task name]
   
   ## What Was Requested
   [FULL TEXT of task requirements]
   
   ## What Implementer Claims They Built
   [From implementer's report]"
   })
   ```

5. **If spec reviewer finds issues:** Dispatch implementer (same subagent skill) to fix them, then re-review. Loop until spec compliance is confirmed.

6. **ONLY after spec compliance is ✅:** Dispatch code quality reviewer via `run_skill`:
   ```
   run_skill({
     name: "code-reviewer",
     arguments: "DESCRIPTION: [task summary from implementer's report]
   PLAN_OR_REQUIREMENTS: Task N from [plan-file]
   BASE_SHA: [commit before task]
   HEAD_SHA: [current commit]"
   })
   ```

7. **If code quality reviewer finds issues:** Implementer fixes them, reviewer reviews again. Loop until approved.

8. **Mark task complete** in `todo_write`.

### After All Tasks

- Dispatch final code reviewer for entire implementation
- Use `finishing-a-development-branch` skill to complete work

## Model Selection

For each subagent dispatch, consider which skill/model to use:
- **Implementer:** Standard subagent skill. Complex tasks may benefit from stronger models.
- **Spec reviewer:** Can be lighter/faster — checklist-focused work.
- **Code quality reviewer:** Standard subagent skill. Needs to understand architecture.

## Handling Implementer Status

| Status | Action |
|--------|--------|
| DONE | Proceed to spec review |
| DONE_WITH_CONCERNS | Proceed with spec review, pay extra attention to concerns |
| BLOCKED | Resolve blocker or ask human partner |
| NEEDS_CONTEXT | Provide context, re-dispatch |

## Red Flags

**Never:**
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- Move to next task while either review has open issues

**If reviewer finds issues:**
- Implementer (same subagent skill) fixes them
- Reviewer reviews again
- Repeat until approved
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

## Integration

**Required workflow skills:**
- **using-git-worktrees** — Ensures isolated workspace
- **writing-plans** — Creates the plan this skill executes
- **requesting-code-review** — Code review template for reviewer subagents
- **finishing-a-development-branch** — Complete development after all tasks

**Subagents should use:**
- **test-driven-development** — Subagents follow TDD for each task

**Alternative workflow:**
- **executing-plans** — Use for parallel session instead of same-session execution
