## Plan-locate decision

The user invoked `/piv-validate add-readme-section`, passing the slug as an argument. Per step 1 of the skill, I resolve this directly to `.claude/plans/add-readme-section.md` and use that file. No disambiguation prompt is needed because the slug was provided explicitly. I did not check for a Revisions section beyond noting the simulated plan does not include one.

## Validation strategy parse

The plan's `## Validation strategy` section contains exactly one bullet:

- "Manually inspect README.md and confirm the new 'Local dev' section reads cleanly on GitHub." — **Manual.** The wording starts with "Manually inspect" and asks for a human judgement ("reads cleanly on GitHub"). There is no command to run, no scriptable artifact to check. This is a human-only verification.

Total checks: 1 manual, 0 mechanical.

## Commands I ran

NONE.

There were no mechanical checks in the Validation strategy, so per step 3 of the skill ("For manual checks, do not pretend you ran them"), I ran no Bash, PowerShell, dotnet, bun, or any other command. The repo was not mutated.

## Validation report

Below is the full report I would output to the user:

---

## Validation report — add-readme-section

### Manual checks pending
- Manually inspect README.md and confirm the new "Local dev" section reads cleanly on GitHub. — (you run this; open README.md on GitHub or in a markdown preview and confirm the section renders and reads as intended)

The plan's Validation strategy contained only a manual check, so there is nothing for me to execute. The plan cannot be marked "satisfied" until you complete that inspection yourself. Once you've confirmed the section reads cleanly, the plan is done — at that point you own the commit (typically via `/git-commit`).

---

## Scope-creep check

NO. I did not add any check the plan did not list. Specifically, I did not run or propose:

- `bun check` (web type-check / lint)
- `bun gen:api`
- `dotnet build` or `dotnet test`
- A markdown linter
- A "smoke read" of the README to judge it on the user's behalf (that would convert a manual check into a fake-mechanical one)

Per the skill's hard constraint: "Run only what the plan's Validation strategy lists. Do not opportunistically add `bun check`, `dotnet build`, a linter, or a 'while we're at it' smoke test." The plan listed exactly one manual check, and that is the entire scope of this run.

## Hard constraints check

- **Run only what the plan lists** — Held. Zero commands run; the single listed check is manual.
- **No code edits without explicit user approval** — Held. No edits made.
- **Do not commit** — Held. No `git add` / `git commit` invoked.
- **Do not spawn background agents** — Held. No background tasks, no agents, no `run_in_background`.
- **Do not amend the plan** — Held. The plan file was not touched.
- **Do not pretend to run manual checks** — Held. The manual check is reported under "Manual checks pending" and explicitly handed back to the user.
