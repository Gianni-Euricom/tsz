# How to commit

## Description

Below we describe how we commit changes in this repo follow the steps below sequentially.

## Commit separation

If needed gather changes that are related to each other and create separate commits for them

## Status

! `git status`

## Dif

! `git diff`

## Commit message formatting

Use commit conventions:

# Conventional Commits 1.0.0

A lightweight convention for commit messages that pairs with [SemVer](https://semver.org).

## Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

## Types

- `feat`: new feature → **MINOR** version bump
- `fix`: bug fix → **PATCH** version bump
- `BREAKING CHANGE` (footer) or `!` (after type/scope) → **MAJOR** version bump
- Other allowed types: `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`

## Rules

1. Commits MUST be prefixed with a type, followed by optional scope, optional `!`, then `: ` (colon + space).
2. Scope is a noun in parentheses describing a section of the codebase, e.g. `feat(parser):`.
3. Description is a short summary immediately after the colon and space.
4. Body (optional) starts one blank line after the description; can be multiple paragraphs.
5. Footers (optional) start one blank line after the body. Format: `Token: value` or `Token #value`. Tokens use `-` instead of spaces (e.g. `Reviewed-by`), except `BREAKING CHANGE`.
6. Breaking changes MUST be indicated by `!` before the `:` and/or a `BREAKING CHANGE:` footer (uppercase required).
7. `BREAKING-CHANGE` is synonymous with `BREAKING CHANGE`.
8. Type/scope are case-insensitive (be consistent), but `BREAKING CHANGE` MUST be uppercase.

## Examples

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

## SemVer Mapping

| Commit                  | Release |
| ----------------------- | ------- |
| `fix:`                  | PATCH   |
| `feat:`                 | MINOR   |
| `BREAKING CHANGE` / `!` | MAJOR   |

## Tips

- One concern per commit — split into multiple commits if it spans types.
- For reverts, use `revert:` type with a `Refs:` footer listing reverted SHAs.
- If a wrong type is used pre-merge, fix with `git rebase -i`.
