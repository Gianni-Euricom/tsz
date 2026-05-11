---
name: git-commit
description: Conventional Commits 1.0.0 toolkit for staging changes, formatting commit messages, and splitting unrelated work into separate commits in this repo. Trigger words: commit, commit changes, git commit, stage, conventional commit, make a commit
---

# Committing changes in this repo

Follow these steps sequentially.

## 1. Inspect the working tree

Run `git status` and `git diff` (and `git diff --cached` if anything is already staged) to see exactly what will be committed.

## 2. Group related changes

If the diff spans unrelated concerns, create separate commits — one concern per commit. Stage only the files belonging to the current commit before running `git commit`.

## 3. Write the commit message

Use Conventional Commits 1.0.0:

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: new feature → **MINOR** version bump
- `fix`: bug fix → **PATCH** version bump
- `BREAKING CHANGE` (footer) or `!` (after type/scope) → **MAJOR** version bump
- Other allowed: `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`

### Rules

1. Prefix with type, optional scope, optional `!`, then `: ` (colon + space).
2. Scope is a noun in parentheses describing a section of the codebase, e.g. `feat(parser):`.
3. Description is a short summary immediately after the colon.
4. Body (optional) starts one blank line after the description.
5. Footers (optional) start one blank line after the body. Format: `Token: value` or `Token #value`. Tokens use `-` instead of spaces (e.g. `Reviewed-by`), except `BREAKING CHANGE`.
6. Breaking changes MUST be indicated by `!` before the `:` and/or a `BREAKING CHANGE:` footer (uppercase required).
7. `BREAKING-CHANGE` is synonymous with `BREAKING CHANGE`.
8. Type/scope are case-insensitive (be consistent); `BREAKING CHANGE` MUST be uppercase.

### Examples

```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

```
feat!: send an email to the customer when a product is shipped
```

```
feat(api)!: send an email to the customer when a product is shipped
```

```
docs: correct spelling of CHANGELOG
```

```
feat(lang): add Polish language
```

```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Reviewed-by: Z
Refs: #123
```

### SemVer mapping

| Commit                  | Release |
| ----------------------- | ------- |
| `fix:`                  | PATCH   |
| `feat:`                 | MINOR   |
| `BREAKING CHANGE` / `!` | MAJOR   |

## 4. Update CHANGELOG.md

Before running `git commit`, append a one-line entry for this commit to `CHANGELOG.md` in the repo root and stage it so it ships in the same commit. Create the file if it does not exist.

Format — compact Keep-a-Changelog, grouped by date:

```
# Changelog

## [YYYY-MM-DD]
- <type>(<scope>): <description>
```

Rules:

- One bullet per commit. Mirror the commit subject (type, scope, `!`, description) — no body, no footers.
- Group under `## [YYYY-MM-DD]` using today's date (ISO 8601, UTC). If a section for today already exists at the top, append to it; otherwise insert a new section above the previous day's.
- Skip entries for `chore`, `ci`, `style`, `test`, `docs` unless they are user-visible.
- When splitting work across multiple commits (see step 2), add one bullet per commit, each in its own commit.

## 5. Tips

- One concern per commit — split into multiple commits if it spans types.
- For reverts, use `revert:` type with a `Refs:` footer listing reverted SHAs.
- If a wrong type is used pre-merge, fix with `git rebase` (non-interactive only — never use `-i`).
