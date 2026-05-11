# piv-implement evaluation — `add-readme-section`

## Plan-locate decision

The user passed an explicit slug argument (`add-readme-section`), so per skill section 1 I resolved it directly to `.claude/plans/add-readme-section.md` without prompting for confirmation. Skill section 1 only mandates a confirm-with-user step in the *fallback* case ("Otherwise, list `.claude/plans/*.md` and pick the most recently modified file. Tell the user which one you picked and ask them to confirm before proceeding"). Since the slug was supplied, I proceed silently with that path.

What I would say to the user: nothing about plan selection — I would jump straight to step 2 ("Reading `.claude/plans/add-readme-section.md`...").

## Affected-areas verification

The plan declares `README.md` as the sole entry under **Affected areas**. I checked the real repo:

- `Read` of `c:\Users\GianniClaes\git\tsz\README.md` → **File does not exist**.
- `Glob` for `*.md` at the repo root → only matches inside `node_modules\` (transitive dep READMEs). No top-level `README.md`.

**Finding: `README.md` does not exist at the repo root.** This is a hard divergence from the plan: every Approach step ("After the existing intro, insert a `## Local dev` heading", "Under that heading add three bullets…") presupposes an existing README with an intro paragraph. That precondition is false.

## Edits I would have made

Per the simulation constraints I am not actually editing files. Walking the Approach as the skill instructs:

### Step 1 — "After the existing intro, insert a `## Local dev` heading"

**Cannot proceed.** There is no `README.md`, therefore there is no "existing intro" to insert after. An `Edit` call would fail (no file to read), and a `Write` call would *create* a brand-new README from nothing — which is no longer "insert after the existing intro" but "author a README from scratch". That changes the scope and the content semantics of the plan.

Hypothetical before/after if I were to barrel ahead anyway (I will NOT, see Drift section):

- File: `c:\Users\GianniClaes\git\tsz\README.md`
- Before: *(file does not exist)*
- After:
  ```markdown
  ## Local dev
  ```

This is precisely the kind of silent guess section 4 of the skill forbids ("Do not silently amend the plan or work around it").

### Step 2 — "Under that heading add three bullets…"

**Blocked on step 1.** Even if I invented an empty README in step 1, the bullets themselves are well-specified. The intended content (only described, not written):

- File: `c:\Users\GianniClaes\git\tsz\README.md`
- Before: *(file does not exist; or whatever step 1 produced)*
- After (appended under the heading):
  ```markdown
  ## Local dev

  - Start the api with `dotnet run --project packages/api`.
  - Start the web with `bun dev` in `packages/web`.
  - The api runs on port 5204.
  ```

But again — I am NOT making this edit. The plan's premise has failed at step 1.

## Drift detected? Yes/No + why

**Yes — drift detected at Approach step 1.**

The trigger from skill section 4 that fires: "A step in **Approach** cannot be done as written (the API doesn't exist, **the file doesn't exist**, the type doesn't match)." The plan assumes a `README.md` with an intro section. Reality: no `README.md` at all.

Per section 4, I stop, summarize, and ask. The crisp framing I would deliver to the user:

> The plan says "After the existing intro, insert a `## Local dev` heading", but there is no `README.md` at the repo root (the only `.md` files at the root are inside `node_modules`). Should I (a) update the plan to "create a new `README.md` containing only this section" and continue, or (b) stop here so we can rethink the scope (e.g. should the README also have a title and intro)?

I would not pick on the user's behalf. I would also not write a `Revisions:` section to the plan file until they pick (a).

## Hard constraints check

Walking skill section 5:

- **"Run no verification commands."** I ran zero `dotnet build`, `dotnet test`, `bun check`, `bun gen:api`, `bun build`, `bun test`, no linters, no formatters. The only commands I ran were `Read`, `Glob`, and a `mkdir -p` / `ls` to ensure the *output* directory for this eval exists (outside the repo's source tree, inside the eval workspace). No verification ran.
- **"Do not commit."** No `git add`, `git commit`, `git stash`, or any `git` mutation. I did not even run `git status`.
- **"Do not spawn background agents."** No `run_in_background: true` calls. No subagents at all.
- **"Stay inside the plan."** I did not edit anything — neither inside nor outside Affected areas. I did not touch `packages/api`, `packages/web`, or any other path. I did not refactor or "tidy" anything I noticed.

All four constraints upheld.

## Final hand-off message

Because drift was detected, the skill says to stop and ask, not to finish. The message I would send the user is the divergence report from the **Drift detected** section above, not a completion summary.

If the user resolved the divergence (say, by approving option (a) — "create a new README with just this section"), I would then perform the two edits, append a `## Revisions` block to the plan file noting the change, and end with the standard finish per section 6:

> Implementation of `add-readme-section` is complete. Pass `add-readme-section` to `/piv-validate` next. One follow-up worth noting (out of scope for this plan): the repo has no top-level `README.md` describing the project itself — you may want a separate plan to add a proper title, overview, and contributor section. I did not act on it.

But in the actual current state — drift at step 1, no user response yet — implementation is **paused, not complete**, and `/piv-validate` should not run.
