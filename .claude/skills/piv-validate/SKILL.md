---
name: piv-validate
description: Third and final step of the Plan / Implement / Validate (PIV) workflow for the tsz repo. Reads the approved plan from .claude/plans/<slug>.md, runs exactly the checks listed in its Validation strategy section, reports results, and on failure proposes a fix for the user to approve before any code edit. Use whenever the user asks to validate, verify, or check the implementation, or says /piv-validate, "validate the plan", "verify the work", "check the implementation", "piv validate", "did it work". Pairs with piv-plan (produced the plan) and piv-implement (executed it).
---

# Validating an implementation against its plan

You are in the **validate** phase of the PIV workflow. Your job is to run the checks the plan committed to and report the result honestly. The plan's **Validation strategy** is the contract — you do not invent additional checks, and you do not skip checks the plan listed. Anything outside that contract is out of scope for this phase.

The contract behind this phase: piv-plan promised a set of checks. piv-implement made changes. You verify those checks pass on those changes. Honesty matters more than a clean report — a check that fails is more useful than a check that was quietly skipped.

Follow these steps in order.

## 1. Locate the plan

If the user passed an argument, use it:

- `/piv-validate add-user-favorites` → `.claude/plans/add-user-favorites.md`
- `/piv-validate .claude/plans/foo.md` → use that path directly

Otherwise, list `.claude/plans/*.md` and pick the most recently modified file. Tell the user which one and ask them to confirm before running anything ("Validating against `add-user-favorites.md` (modified 10 minutes ago) — proceed?").

If the plan has a **Revisions** section (added during piv-implement when the plan drifted), read it carefully — it may have changed what counts as "done."

## 2. Read the Validation strategy

The plan has a `## Validation strategy` section. Treat it as the entire scope of this run. Each bullet is one check. Checks come in two flavors:

- **Mechanical** — a command or scriptable verification. Examples: `dotnet test packages/api.tests`, `bun gen:api && bun check` in `packages/web`, "build the api project."
- **Manual** — something only a human can confirm. Examples: "load /foo and confirm X renders", "verify the dialog closes on Escape."

For each check, write down (in your own working memory, not on disk) the exact command or the manual instruction you'll run.

If the **Validation strategy** is missing, empty, or unparseable, stop and tell the user — that's a piv-plan bug. Don't invent checks to fill the gap.

## 3. Run the checks

Run mechanical checks one by one in the foreground using `Bash` / `PowerShell`. After each, capture pass / fail and the relevant output. Don't run them in parallel — failure messages are easier to read sequentially, and one failure may make others meaningless.

Run commands exactly as the plan wrote them. If the plan says `dotnet test packages/api.tests`, do not "improve" it to `dotnet test packages/api.tests --verbosity normal`. Faithfulness to the plan is the whole point.

For manual checks, do not pretend you ran them. List them at the end of the report under **Manual checks pending** — the user will do those themselves.

## 4. Report results

Produce a concise report with this structure:

```
## Validation report — <plan slug>

### Passed
- <check> — <one-line evidence, e.g. "32 tests, 0 failures">

### Failed
- <check> — <short summary of failure>

### Manual checks pending
- <check> — (the user runs this)
```

Omit empty sections. If everything passed, a single line is enough: "All checks passed for `<slug>`."

## 5. Handle failures: report, then propose a fix

For each failed check, after the report, propose a fix. Do not edit any file before the user approves.

Format the proposal as:

```
**Fix proposal for `<failed check>`**

Cause: <one or two sentences on why it failed>

Proposed change: <either a unified diff for small edits, or a short description for larger ones>

Confidence: <high | medium | low>
```

Calibrate the proposal to the failure:

- **Mechanical** failures (formatter, missing import, regenerable types out of date) — propose a small edit or a regen command (`bun gen:api`). High confidence is fine.
- **Test assertion** failures or **logic bugs** — propose a description, not a diff. Confidence should usually be "low" or "medium," because the right fix often requires understanding intent that lives with piv-plan/piv-implement.
- **Type errors** — diagnose first; the cause may be a stale `schema.ts` (run `bun gen:api`) rather than a real type mismatch.

After the proposals, ask the user how to proceed for each one:

- **Apply this fix** — apply the proposed edit, then re-run only the failed checks (not all of them).
- **Send back to piv-implement** — stop. The user will invoke `/piv-implement` again with adjusted guidance.
- **Skip** — leave it failing, the user wants to review themselves.

If the user approves a fix, apply it, re-run the affected check, and update the report. Do not chain-apply fixes without re-asking — each approval is for one fix at a time.

## 6. Hard constraints

These boundaries are what make the validate phase trustworthy.

- **Run only what the plan's Validation strategy lists.** Do not opportunistically add `bun check`, `dotnet build`, a linter, or a "while we're at it" smoke test. If the plan didn't list it, it isn't in scope. If you think the plan was under-specified, say so in the report — don't silently expand scope.
- **No code edits without explicit user approval.** Even a one-character typo fix needs approval first. Surprise edits during validation undermine the whole workflow.
- **Do not commit.** No `git add`, no `git commit`. The user reviews the diff and commits manually (often via `/git-commit`).
- **Do not spawn background agents.** Validation needs to be visible and interruptible — keep all work in the foreground.
- **Do not amend the plan.** If the plan was wrong, that is a piv-plan or piv-implement issue. Note it in the report and let the user route it.

## 7. Finish

When all checks (and any approved fixes) are settled:

1. Print the final report.
2. State plainly whether the plan was satisfied: "All planned checks pass — implementation matches the plan" or "X checks failed and were not fixed — see report."
3. If checks remain manual, remind the user they still need to run those.
4. Stop. Do not commit. The user owns the next step.
