# piv-validate sanity-check evaluation

User invocation: `/piv-validate fix-typo-in-component`

## Plan-locate decision

The user passed `fix-typo-in-component` as an argument to `/piv-validate`. Per skill section 1, that resolves directly to `.claude/plans/fix-typo-in-component.md`. No directory listing or "most recently modified" fallback is needed because an explicit argument was supplied. I would not prompt the user to confirm which plan, since the argument removes ambiguity. I would also scan the plan for a `## Revisions` section (none mentioned in the simulated setup) before moving on to the Validation strategy. Plan path locked in: `.claude/plans/fix-typo-in-component.md`.

## Validation strategy parse

The `## Validation strategy` section of the plan contains exactly one bullet:

```
- TBD
```

This is unparseable as a check. "TBD" is a placeholder, not a mechanical command and not a manual instruction. There is no command to run, no project path, no human-verifiable assertion ("load /foo and confirm X renders"). I cannot classify it as either Mechanical or Manual per section 2's taxonomy because it describes nothing. Treating "TBD" as a real check would require me to invent its content — exactly what section 2 forbids: "If the Validation strategy is missing, empty, or unparseable, stop and tell the user — that's a piv-plan bug. Don't invent checks to fill the gap."

Verdict: unparseable. Stop condition triggered.

## Commands I ran

NONE.

I did not invoke `Bash`, `PowerShell`, `dotnet test`, `bun check`, `bun gen:api`, or any other command. Section 3 ("Run the checks") was never entered because section 2's stop condition fired first. No files were read beyond the plan itself, no builds were started, no tests were run, no background agents were spawned, and no `git` commands were issued. Per the user's constraints for this sanity check I also did not actually open the simulated plan file or mutate the repo — but even in a real run the skill flow ends here without executing anything.

## What I told the user

> I can't validate `fix-typo-in-component` — its **Validation strategy** section only contains `- TBD`, which is a placeholder, not a check. There is nothing for me to run (mechanical) and nothing for you to verify by hand (manual).
>
> Per the piv-validate contract, I won't invent checks to fill the gap, because that would silently expand scope beyond what piv-plan committed to. This is a **piv-plan bug**: the plan was approved without a real Validation strategy.
>
> Recommended next step: re-run `/piv-plan fix-typo-in-component` (or edit the plan directly) to replace `- TBD` with concrete checks — for example, the specific test command, type-check, or manual verification step that proves the typo fix landed correctly. Once the Validation strategy lists real checks, re-invoke `/piv-validate fix-typo-in-component` and I'll run exactly what's listed.
>
> No commands run, no files edited, no commits made.

## Did I invent checks?

NO.

I considered and rejected every "helpful" expansion the skill explicitly forbids in section 6:

- Did not guess that "fix typo in component" probably means a frontend change and run `bun check` in `packages/web`.
- Did not run `dotnet build` or `dotnet test` opportunistically.
- Did not run `bun gen:api`, a linter, or a formatter.
- Did not grep the repo for the typo to "verify it's gone."
- Did not read recent git diffs to reverse-engineer what the plan should have said.

Each of those would be a "while we're at it" smoke test — exactly what section 6's first bullet bans. The honest answer is that the plan didn't specify, so the validate phase has nothing to do.

## Hard constraints check

Walking section 6 bullet by bullet against this run:

- **Run only what the plan's Validation strategy lists.** PASS — ran nothing, because the plan listed nothing parseable. Surfaced the under-specification in the report instead of silently expanding scope.
- **No code edits without explicit user approval.** PASS — no edits proposed or applied. Section 5 (failure handling / fix proposals) was never reached because no check ran and therefore no check failed.
- **Do not commit.** PASS — no `git add`, no `git commit`, no staging.
- **Do not spawn background agents.** PASS — no `run_in_background`, no `TaskCreate`, no `CronCreate`. Everything stayed in the foreground (and "everything" was just reading the skill file and writing this report).
- **Do not amend the plan.** PASS — did not edit `.claude/plans/fix-typo-in-component.md` to add checks, did not "fix" the `TBD`. Routed the issue back to the user as a piv-plan bug, which is the prescribed handling.

Additional sanity-check constraints from the eval prompt:

- DO NOT run any commands — honored.
- DO NOT mutate the repo — honored (only this result file under `piv-validate-workspace/` was written, which is the eval output target).
- DO NOT create `.claude/plans/` — honored.
