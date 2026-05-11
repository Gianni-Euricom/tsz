## Restated task

The OpenAPI generator is producing TS fields as optional (`?`) where they should be required. Commit `f4ae10f` (and follow-up `78c78b0`) recorded the fix in `REVIEW.md` but did not apply it to the API. Plan another pass to apply that guidance to `Program.cs` and verify any remaining optional-where-should-be-required fields are gone from the generated `schema.ts`.

## Investigation

Light, scoped to what the user named:

- Read `.claude/skills/piv-plan/SKILL.md` to confirm planning rules.
- `git show f4ae10f --stat` and `git show f4ae10f`: the commit only edits `REVIEW.md`. It adds a recommendation for `JsonNumberHandling.Strict`.
- `git show 78c78b0`: extends the same `REVIEW.md` block with a `AddSchemaTransformer` snippet that adds every non-nullable property to `schema.Required`.
- Read `REVIEW.md` (lines 101–129): contains the full recommended `Program.cs` snippet.
- Read `packages/api/Program.cs`: current code is `builder.Services.AddOpenApi();` with no `ConfigureHttpJsonOptions`, no schema transformer. The REVIEW.md guidance was never wired into source.
- Read `packages/web/src/api/schema.ts`: confirms the symptom. `Animal.id/name/species/age` are all `?` optional, `CreateAnimalRequest.age` and `UpdateAnimalRequest.age` are `?`, and `int32` properties are typed `number | string` (the lack-of-strict-number-handling tell).

That's enough to scope the change. No broader tour needed.

## Plan I would have written to .claude/plans/<slug>.md

Slug: `fix-openapi-required-fields`
Path: `c:\Users\GianniClaes\git\tsz\.claude\plans\fix-openapi-required-fields.md`

```
# Fix OpenAPI generator producing optional TS fields

## Goal
Apply the OpenAPI tightening recommended in REVIEW.md so the generated `packages/web/src/api/schema.ts` marks non-nullable C# properties as required (no `?`) and types `int32` fields as plain `number` (not `number | string`).

## Affected areas
- packages/api/Program.cs
- packages/web/src/api/schema.ts (regenerated, not hand-edited)

## Approach
1. In `packages/api/Program.cs`, add `using System.Text.Json.Serialization;` and `using Microsoft.OpenApi.Models;` (or whichever namespace exposes `JsonSchemaType` for the installed OpenAPI package — verify against the existing `AddOpenApi` reference before editing).
2. Before `builder.Build()`, add `builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);` exactly as in REVIEW.md.
3. Replace `builder.Services.AddOpenApi();` with the `AddOpenApi(options => options.AddSchemaTransformer(...))` block from REVIEW.md lines 110–128 that walks `schema.Properties` and adds every non-nullable property name to `schema.Required`.
4. Start the API locally on port 5204 (the user runs this; piv-implement does not run servers).
5. In `packages/web`, run `bun gen:api` to regenerate `src/api/schema.ts` against the running API.
6. Spot-check the regenerated `schema.ts`: `Animal`, `CreateAnimalRequest`, `UpdateAnimalRequest` should have no `?` on `name`/`species`/`age`/`id`, and `int32` fields should be plain `number`.

## Out of scope
- Adding new endpoints, DTOs, or schema changes.
- Touching web consumer code that previously coped with optional fields — leave that to a follow-up if any TS errors surface (list under Validation).
- Changing `JsonNumberHandling` anywhere outside the OpenAPI/HTTP JSON pipeline.

## Open questions
- Should `AnonymousTypeOfstringAndstring` (the `/` root response) be replaced with a named DTO so the schema transformer produces a clean type? Current shape uses `null | string` which is intentional. Default: leave as-is unless the user says otherwise.

## Validation strategy
- `dotnet build packages/api` succeeds (namespace/import for `JsonSchemaType` resolves).
- With API running on :5204, `bun gen:api` in `packages/web` regenerates `schema.ts` without error.
- In the regenerated `packages/web/src/api/schema.ts`: `Animal`, `CreateAnimalRequest`, `UpdateAnimalRequest` have NO `?` markers on their declared properties; `int32`-formatted fields are typed `number` (not `number | string`).
- `bun check` in `packages/web` passes — surface any new TS errors caused by fields becoming required so the user can decide whether to fix them in this plan or a follow-up.
- `dotnet test packages/api.tests` and `dotnet test packages/api.tests.integration` still pass.
```

## ExitPlanMode payload

(Identical to the plan body above; this is what would be passed to `ExitPlanMode` after writing the file to disk.)

```
# Fix OpenAPI generator producing optional TS fields

## Goal
Apply the OpenAPI tightening recommended in REVIEW.md so the generated `packages/web/src/api/schema.ts` marks non-nullable C# properties as required (no `?`) and types `int32` fields as plain `number` (not `number | string`).

## Affected areas
- packages/api/Program.cs
- packages/web/src/api/schema.ts (regenerated, not hand-edited)

## Approach
1. In `packages/api/Program.cs`, add `using System.Text.Json.Serialization;` and the namespace exposing `JsonSchemaType` for the installed OpenAPI package.
2. Before `builder.Build()`, add `builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);`.
3. Replace `builder.Services.AddOpenApi();` with the `AddOpenApi(options => options.AddSchemaTransformer(...))` block from REVIEW.md that adds every non-nullable property name to `schema.Required`.
4. User starts the API locally on port 5204.
5. In `packages/web`, run `bun gen:api` to regenerate `src/api/schema.ts`.
6. Spot-check that `Animal`, `CreateAnimalRequest`, `UpdateAnimalRequest` have no `?` on declared properties and that `int32` fields are plain `number`.

## Out of scope
- New endpoints/DTOs.
- Fixing web consumer code that breaks once fields become required (follow-up if needed).
- Changing `JsonNumberHandling` outside the HTTP JSON pipeline.

## Open questions
- Replace `AnonymousTypeOfstringAndstring` at `/` with a named DTO? Default: leave as-is.

## Validation strategy
- `dotnet build packages/api` succeeds.
- With API on :5204, `bun gen:api` in `packages/web` regenerates `schema.ts`.
- Regenerated `schema.ts`: no `?` on `Animal`/`CreateAnimalRequest`/`UpdateAnimalRequest` properties; `int32` fields are `number` not `number | string`.
- `bun check` in `packages/web` passes.
- `dotnet test packages/api.tests` and `dotnet test packages/api.tests.integration` pass.
```

## Hard constraints check

- No source code edited. Only files I would write are `.claude/plans/fix-openapi-required-fields.md` (not actually written here per eval rules — captured inline).
- No tests, builds, formatters, type-checkers, or `bun gen:api` run during planning.
- No background or subagent spawned. Investigation was inline `Read` + `git show` only.
- No silent overwrite — slug derived as `fix-openapi-required-fields`; would `-2` if it already existed.
- Reads were narrowly scoped to user-named commit, the `REVIEW.md` it edits, the implied `Program.cs`, and the implied `schema.ts`.

## Tightness check

- **Affected areas:** 2 bullets (`packages/api/Program.cs`, `packages/web/src/api/schema.ts` regenerated).
- **Approach:** 6 numbered steps.
- **Out of scope:** 3 bullets.
- **Open questions:** 1 bullet.
- **Validation strategy:** 5 bullets.

The plan is appropriately small for a narrow bug fix. The Approach has 6 steps because the change spans two packages and requires the (user-run) API restart + types regen handoff that the skill explicitly demands. Steps 1–3 are the actual code edit, step 4 is a user/runtime gate, steps 5–6 are the consequence. Could be squashed to 4 if step 1 is folded into step 3 and step 6 is folded into Validation, but listing the import + regen-spot-check explicitly is what the skill asks for ("each step should be small enough that piv-implement can do it without re-planning").
