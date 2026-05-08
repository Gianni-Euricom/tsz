---
name: piv-implement
description: Second step of the Plan / Implement / Validate (PIV) workflow for the tsz repo. Reads an approved plan from .claude/plans/<slug>.md and executes its Approach steps in order, stopping to ask the user whenever reality diverges from the plan. Runs no tests, builds, type-checks, or formatters (those belong to piv-validate) and never commits (the user does that). Use whenever the user asks to execute, build out, or apply a plan, or says /piv-implement, "implement the plan", "do the plan", "execute the plan", "piv implement", "build it". Pairs with piv-plan (produces the plan) and piv-validate (verifies the result).
---

# Implementing an approved plan

You are in the **implement** phase of the PIV workflow. You execute an already-approved plan from `.claude/plans/<slug>.md`. Verification is `piv-validate`'s job; planning is `piv-plan`'s. Your scope: turn the plan's **Approach** steps into code.

The contract behind this phase: the user already approved a plan. They expect you to follow it. If you discover the plan was wrong, that is important information — stop and tell them, do not paper over it. The discipline of not checking your own work (no builds, no tests) is what gives `piv-validate` something honest to verify against.

Follow these steps in order.

## 1. Locate the plan

If the user passed an argument, use it:

- `/piv-implement add-user-favorites` → `.claude/plans/add-user-favorites.md`
- `/piv-implement .claude/plans/foo.md` → use that path directly

Otherwise, list `.claude/plans/*.md` and pick the most recently modified file. Tell the user which one you picked and ask them to confirm before proceeding ("Going to implement `add-user-favorites.md` (modified 2 hours ago) — proceed?"). This catches the case where they meant a different plan.

If `.claude/plans/` is missing or empty, stop and tell the user to run `/piv-plan` first.

## 2. Read and internalize the plan

Read the entire plan. Pay attention to:

- **Approach** — the ordered steps you will execute.
- **Affected areas** — the file paths you are licensed to touch.
- **Out of scope** — things you must NOT touch even if tempting.
- **Open questions** — if any look unresolved, stop and surface them. Do not guess.

If any part of the plan is ambiguous to you, ask before starting. A confused start poisons the whole implementation.

## 3. Execute the Approach steps in order

Walk **Approach** from top to bottom. For each step:

1. State which step you are on in one short sentence.
2. Make the edits with `Edit` / `Write`. Keep edits scoped to files in **Affected areas**.
3. Move to the next step.

Keep work in the foreground so the user can interrupt. Do not parallelize across steps — the plan's order is usually deliberate. Foreground subagents are fine for a single step that genuinely needs them; background agents (`run_in_background: true`) are not — they hide work.

## 4. Stop and ask when reality diverges from the plan

If you discover any of the following during implementation, **stop**, summarize the divergence, and ask the user how to proceed. Do not silently amend the plan or work around it.

Triggers to stop on:

- A step in **Approach** cannot be done as written (the API doesn't exist, the file doesn't exist, the type doesn't match).
- You need to edit a file not listed in **Affected areas**.
- An item in **Out of scope** turns out to be unavoidable.
- An **Open question** marked "None" actually has an answer that changes the work.
- The plan assumed a structure the code doesn't actually have.

Frame the stop crisply: "The plan says X, but Y. Should I (a) update the plan and continue, or (b) stop here so we can rethink?" Let the user choose. If they pick (a), update the plan file with a short **Revisions** section noting what changed and why before continuing — the file is the source of truth that `piv-validate` will read.

## 5. Hard constraints

These boundaries keep the PIV phases independent. Each one exists for a reason; ignoring them collapses the workflow back into ad-hoc coding.

- **Run no verification commands.** No `dotnet build`, `dotnet test`, `bun check`, `bun gen:api`, `bun build`, `bun test`, no linters, no formatters. `piv-validate` runs all of these.
- **Do not commit.** No `git add`, no `git commit`, no `git stash`. Leave the working tree dirty when you're done — the user will review the diff and commit (often via `/git-commit`).
- **Do not spawn background agents.** Foreground subagents for a single large step are fine; background agents are not.
- **Stay inside the plan.** Do not refactor, rename, or "tidy up" things outside **Affected areas**, even if you notice they are broken. Note them for the user at the end — do not act on them.

## 6. Finish

When all **Approach** steps are done:

1. Tell the user implementation is complete.
2. Mention the plan slug so they know which plan to pass to `/piv-validate`.
3. List anything you noticed that is outside the plan's scope but might be worth a follow-up. Do not act on these — surface them only.
4. Stop. Do not run validation, do not commit. The next phase is `/piv-validate`.
