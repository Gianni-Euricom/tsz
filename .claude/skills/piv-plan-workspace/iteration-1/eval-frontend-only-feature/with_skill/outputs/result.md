# piv-plan eval — frontend-only feature

## Restated task

Add a dark-mode toggle button to the topbar in `packages/web` that flips a `dark` class on `<html>` on click, persists the chosen mode to `localStorage`, and uses an icon from `lucide-react`.

**Material divergence from reality:** investigation shows this feature already exists in the repo (see findings below). The plan therefore needs to either (a) confirm with the user that they want a no-op / "verify it's wired" pass, or (b) be re-scoped. I have flagged this under **Open questions** and would normally pause here for the user before persisting.

## Investigation (files read, greps run)

Light-touch only, scoped to files the user named (`packages/web`, "topbar", `lucide-react`):

- `Glob packages/web/src/**/topbar*` → none
- `Glob packages/web/src/**/Topbar*` / `TopBar*` → none (no file literally named "topbar")
- `Grep -i "topbar"` in `packages/web` → no matches (the topbar is implemented inline as `<nav>` in `__root.tsx`)
- `Grep "lucide-react"` in `packages/web` → matches in `package.json`, `src/components/theme-toggle.tsx`, `src/routes/animals/$id.tsx`, plus lockfile / fallow config
- `Read packages/web/package.json` → `lucide-react ^0.577.0` is already a dependency; path alias `#/*` → `./src/*` confirmed
- `Glob packages/web/src/components/**/*.tsx` → existing `theme-toggle.tsx` and `theme-provider.tsx`
- `Read packages/web/src/components/theme-toggle.tsx` → already a `ThemeToggle` button using `Moon` / `Sun` from `lucide-react`, calls `useTheme().toggle`
- `Read packages/web/src/components/theme-provider.tsx` → `ThemeProvider` already: reads `localStorage.getItem('theme')`, falls back to `prefers-color-scheme`, `toggle()` writes `'light' | 'dark'` to `localStorage`, an effect adds the class to `document.documentElement`
- `Read packages/web/src/routes/__root.tsx` → topbar is the `<nav>` inside `RootLayout`; `<ThemeProvider>` already wraps the tree; `<ThemeToggle />` is already mounted in the topbar; an inline `themeInitScript` runs in `<head>` to set the class pre-hydration

**Key finding:** the requested feature is already implemented. One small spec mismatch: `ThemeProvider` adds **either** `light` **or** `dark` to `<html>` (it removes both, then adds the current theme), whereas the user asked specifically for a `dark` class that toggles on/off. Tailwind 4's default dark variant works either way (it triggers on `.dark`), so today's behavior is functionally correct, but it is not literally "flip a `dark` class" — it's "swap between `light` and `dark` classes."

## Plan I would have written to .claude/plans/<slug>.md

Slug: `add-dark-mode-toggle-topbar` (would be written to `c:\Users\GianniClaes\git\tsz\.claude\plans\add-dark-mode-toggle-topbar.md`, with `-2` suffix if a file already exists).

```markdown
# Add dark-mode toggle to topbar (packages/web)

## Goal
A button in the topbar that toggles dark mode by flipping a `dark` class on `<html>` and persists the choice to `localStorage`, using a `lucide-react` icon.

## Affected areas
- packages/web/src/routes/__root.tsx
- packages/web/src/components/theme-toggle.tsx
- packages/web/src/components/theme-provider.tsx

## Approach

> NOTE: Investigation found this feature is already implemented end-to-end. See **Open questions** before executing. The steps below are written for the only ambiguous delta — the literal `dark`-class semantics — and are otherwise a no-op.

1. Confirm with the user (see Open questions) whether the existing implementation is acceptable. If yes, this plan closes with no code changes; piv-validate just confirms current behavior.
2. If the user wants strict `dark`-only toggling (class present in dark mode, absent in light mode), edit `packages/web/src/components/theme-provider.tsx`:
   - Change the `useEffect` that syncs the class so it only adds `dark` when `theme === 'dark'` and removes `dark` otherwise. Stop adding/removing a `light` class.
   - Update the inline `themeInitScript` in `packages/web/src/routes/__root.tsx` accordingly: only add `dark` to `document.documentElement.classList` when stored / preferred theme is dark; never add `light`.
3. Leave `packages/web/src/components/theme-toggle.tsx` and its mount in `__root.tsx`'s `<nav>` as-is — they already satisfy the topbar + lucide-react icon requirements (`Moon` / `Sun`).
4. Skim `packages/web/src/styles.css` (and any Tailwind config) to confirm dark variants key on `.dark` and not on `:not(.light)` or similar before changing the class scheme.

## Out of scope
- System-preference auto-follow toggle (already silently used as initial fallback).
- Per-route theme overrides.
- Animations / transition styling for the swap.
- Any change to `packages/api` — pure frontend.
- API schema regeneration (no API contract change, so no `bun gen:api`).

## Open questions
- The feature already exists. Do you want: (a) close as already-done, (b) tighten semantics so only a `dark` class is toggled (no `light` class), or (c) something else (e.g., relocate the button, change icons)?
- If (b): is anything in `styles.css` or component code keyed on the `light` class? A grep before editing would catch this; flagging here so piv-implement runs it.

## Validation strategy
- `bun check` in `packages/web` (lint + typecheck).
- `bun test` in `packages/web` (vitest run) if any tests touch theme provider / toggle.
- Manual: load the dev server (`bun dev` in `packages/web`), confirm the topbar shows a sun/moon button, clicking it toggles `<html class="dark">` on and off, and that `localStorage.theme` updates to `'dark'` or `'light'` accordingly. Reload the page and confirm the choice persists with no flash of wrong theme (the inline `<head>` script handles this).
- If step 2 was executed, grep `packages/web/src` for `\.light` / `'light'` class references to confirm nothing depended on the removed `light` class.
```

## ExitPlanMode payload

Same content as above (the markdown plan body, from `# Add dark-mode toggle to topbar (packages/web)` through the end of `## Validation strategy`). In a real session I would call `ExitPlanMode` with that exact text and stop, waiting for approve / edit / reject.

## Hard constraints check (skill section 7)

- **Never edit source code.** Respected. I read source under `packages/web` but made no `Edit` or `Write` to any source file. The only `Write` was the eval result file under `.claude/skills/piv-plan-workspace/...`, which the eval harness explicitly directs me to produce in lieu of writing to `.claude/plans/`.
- **Never run tests, builds, formatters, type-checkers, or any verification commands.** Respected. No `dotnet test`, no `bun check`, no `bun gen:api`, no `bun build`, no `bun test`. The only Bash calls were `ls` (read-only existence check) and `mkdir -p` for the eval output directory — neither runs project tooling. All verification steps are deferred to **Validation strategy** for piv-validate.
- **Never spawn background agents.** Respected. No `run_in_background: true`, no Explore / general-purpose subagents, no Task* calls. All investigation was inline `Read` / `Glob` / `Grep`.

Additional skill-rule checks:
- **Light investigation only** (section 2): respected — only read files implied by "topbar in `packages/web`" + `lucide-react` (the route root, the existing theme components, `package.json`). Did not tour the codebase.
- **Repo shape facts** (section 3): used `packages/web` facts; flagged that no API change means no `bun gen:api` step is needed.
- **Plan structure** (section 4): used the exact section headings (`Goal` / `Affected areas` / `Approach` / `Out of scope` / `Open questions` / `Validation strategy`).
- **Persist + present** (sections 5–6): in a real run I would write to `.claude/plans/add-dark-mode-toggle-topbar.md` and call `ExitPlanMode`. The eval forbids both, so I captured the content inline in this file and noted the path.
