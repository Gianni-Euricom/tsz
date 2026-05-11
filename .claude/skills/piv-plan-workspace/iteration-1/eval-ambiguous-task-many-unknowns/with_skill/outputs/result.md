# piv-plan eval — ambiguous task, many unknowns

## Restated task

You want to migrate `packages/api` from SQLite (its current EF Core provider) to PostgreSQL as the production database. Before drafting a confident plan I need answers to several open questions, because "migrate from SQLite to Postgres" can mean very different things depending on whether existing data must move, where Postgres will run, and how the test stack should change.

## Investigation

Light reads only — files the user implicitly named by saying "the api":

- `packages/api/api.csproj` — currently references `Microsoft.EntityFrameworkCore.Sqlite` 10.0.7 and `Microsoft.EntityFrameworkCore.Design` 10.0.7. No Npgsql package present.
- `packages/api/Program.cs` — wires `AddDbContext<AnimalDbContext>` with `options.UseSqlite(...)` and a fallback connection string `"Data Source=animals.db"`. Calls `db.Database.EnsureCreated()` on startup and seeds 100 animals if the table is empty.
- `packages/api/Modules/Animals/AnimalDbContext.cs` — single `DbContext`, applies `AnimalConfiguration`. No provider-specific code visible at this level.
- `packages/api/Migrations/` — one migration `20260424094228_InitialCreate` plus a snapshot. Migrations were generated against the Sqlite provider, so EF Core column types and the snapshot's `HasAnnotation("Relational:...")` will need to be regenerated for Npgsql (Sqlite and Npgsql disagree on, e.g., autoincrement/identity, datetime types, default value SQL).
- `packages/api/appsettings.json` and `appsettings.Development.json` — no `ConnectionStrings` section today; the code falls back to the hard-coded `"Data Source=animals.db"`.
- `packages/api.tests.integration/AnimalEndpointsTests.cs` — replaces `AnimalDbContext` with `UseInMemoryDatabase` per test, so integration tests do NOT depend on the production provider. Provider switch should not break these.
- `packages/api.tests/` — only `obj/` files appeared in glob, so I did not inspect unit-test internals. Flagged under Open questions.

I deliberately did not search the rest of the repo, did not read `packages/web`, and did not run any commands.

## Plan I would have written to .claude/plans/<slug>.md

> Note: per the skill's hard constraints I did NOT write the file in this eval. I also would not write it for real until the Open questions below are answered, because writing a confident `Approach` against unresolved choices is exactly what the plan phase is supposed to prevent. The draft below is what I would propose AFTER the user resolves the open questions; today it is shown inline only.

```
# Migrate api from SQLite to PostgreSQL

## Goal
Replace the EF Core Sqlite provider in `packages/api` with the Npgsql PostgreSQL provider so the API targets PostgreSQL in development and production, while keeping integration tests on InMemory.

## Affected areas
- packages/api/api.csproj
- packages/api/Program.cs
- packages/api/Modules/Animals/AnimalDbContext.cs (verify — likely no change)
- packages/api/Modules/Animals/AnimalConfiguration.cs (verify column types)
- packages/api/Migrations/20260424094228_InitialCreate.cs (regenerate)
- packages/api/Migrations/20260424094228_InitialCreate.Designer.cs (regenerate)
- packages/api/Migrations/AnimalDbContextModelSnapshot.cs (regenerate)
- packages/api/appsettings.json
- packages/api/appsettings.Development.json
- packages/api.tests.integration/AnimalEndpointsTests.cs (verify still uses InMemory; no change expected)
- (possibly) docker-compose / dev-environment file for a local Postgres — UNKNOWN, see Open questions
- (possibly) README / CONTRIBUTING — UNKNOWN, see Open questions

## Approach
1. Replace `Microsoft.EntityFrameworkCore.Sqlite` 10.0.7 with `Npgsql.EntityFrameworkCore.PostgreSQL` (matching EF Core 10 line) in `packages/api/api.csproj`.
2. In `Program.cs`, swap `options.UseSqlite(...)` for `options.UseNpgsql(...)` and remove the `"Data Source=animals.db"` fallback. Require the connection string to come from configuration; fail fast if absent.
3. Add a `ConnectionStrings:DefaultConnection` entry to `appsettings.Development.json` pointing at a local Postgres (host/db name TBD per Open questions). Do not commit production credentials — `appsettings.json` keeps no real connection string.
4. Decide migrations strategy (see Open questions). Default proposal: delete the existing Sqlite-generated migration files under `packages/api/Migrations/` and re-create with `dotnet ef migrations add InitialCreate` against the Npgsql provider. The migration is currently empty of data and only one revision exists, so a clean regeneration is cheapest.
5. Replace `db.Database.EnsureCreated()` in `Program.cs` with `db.Database.Migrate()` so the new migration is actually applied at startup (EnsureCreated bypasses migrations).
6. Review `AnimalConfiguration.cs` for any Sqlite-specific column types or value generation strategies; switch to Postgres-friendly equivalents (e.g., `serial`/identity for the primary key) if needed.
7. Confirm `packages/api.tests.integration/AnimalEndpointsTests.cs` still works by virtue of `UseInMemoryDatabase` — no code change expected, but list it in Validation.
8. Document the local Postgres requirement (how to start it, default connection string) somewhere developers will find — exact file TBD per Open questions.

## Out of scope
- Migrating any existing production SQLite data into Postgres (the seed runs from code, so there is no real data to move unless the user says otherwise).
- Changes to `packages/web` — the API surface and OpenAPI schema do not change, so no `bun gen:api` is needed.
- Performance tuning, connection pooling configuration, or read-replica setup.
- CI changes to spin up a Postgres service container — depends on whether CI currently runs anything against the live DB, which is unknown.

## Open questions
- Why the migration? Is this driven by a deployment requirement, multi-instance scaling, a feature blocked by Sqlite, or something else? The motivation changes the right defaults (e.g., whether to keep Sqlite as a dev-only fallback).
- Target Postgres version (16? 17?) and where it runs in production (managed service like RDS/Azure Flexible/Neon, vs. self-hosted)?
- Local development story: should developers run Postgres via Docker Compose, a global install, or a hosted dev DB? Is there an existing `docker-compose.yml` or dev script in the repo I should extend?
- Do we need to preserve any existing data in the current `animals.db` SQLite file, or is the seed-from-code path sufficient (i.e., a clean Postgres database is acceptable)?
- Migrations strategy: regenerate the single existing migration against Npgsql (clean), or keep history and add a new "switch provider" migration (preserves audit trail but complicates the model snapshot)?
- Connection string management: env var, `dotnet user-secrets`, `appsettings.Development.json`, or `.env`? Any existing convention in this repo I should follow?
- Should the API still support Sqlite as an opt-in fallback (e.g., for local dev or tests), or is this a hard cut?
- Do `packages/api.tests` (unit tests) reference the Sqlite provider directly? I did not inspect them in this light pass — flag for confirmation before plan finalisation.
- Does CI currently spin up any database, and does the CI workflow need a Postgres service container?
- Are there other modules/contexts beyond `AnimalDbContext` planned soon that should share the connection-string convention chosen here?
- Naming and ownership of the database (e.g., `tsz`, `tsz_dev`, schema choice — `public` vs. a named schema)?
- Should `Program.cs` retry on transient connection failures at startup (Postgres is networked, unlike Sqlite), or is fail-fast acceptable?

## Validation strategy
- `dotnet build packages/api/api.csproj` succeeds with the new package reference.
- `dotnet ef migrations list` (against the new provider) shows the regenerated InitialCreate migration.
- `dotnet test packages/api.tests` passes.
- `dotnet test packages/api.tests.integration` passes (still InMemory; smoke check that nothing else broke).
- Manual: start a local Postgres matching the chosen dev convention, run the API, hit `/api/animals`, confirm the seed populated 100 animals and CRUD endpoints work.
- Confirm `packages/web/src/api/schema.ts` does NOT need regeneration (no request/response shape changed); note in the report so piv-validate can sanity-check the diff.
```

## ExitPlanMode payload

I would NOT call `ExitPlanMode` yet. The skill says step 1 is "wait for confirmation only if your restatement materially differs" — but the more important rule is step 2: when investigation surfaces this many unknowns, the right move is to surface them and ask, not to ship a confident plan into `ExitPlanMode`.

So instead of an `ExitPlanMode` payload, I would respond to the user with:

> Before I draft and persist a plan, I need answers to the Open questions above (especially: target Postgres host, local-dev story, and whether existing `animals.db` data must be preserved). The Approach changes meaningfully depending on those. Want to answer them, or should I assume defaults (clean DB, local Docker Postgres, hard cut from Sqlite, regenerated single migration) and present a plan based on those assumptions for you to edit?

If the user picks "use defaults", THEN I would write the file at `c:\Users\GianniClaes\git\tsz\.claude\plans\migrate-api-sqlite-to-postgres.md` with the draft above and call `ExitPlanMode` with the exact plan body shown in the previous section.

## Open questions count

12 bullets under Open questions. The skill expects MANY here because the prompt "migrate the api from sqlite to postgres" is genuinely under-specified — it gives a from/to but no motivation, environment, data-preservation requirement, or deployment story.

## Hard constraints check

- No source files were edited — confirmed. The only filesystem write is this eval `result.md` under `piv-plan-workspace/`, which is the eval harness's expected output location and is NOT under `.claude/plans/`. (The skill's "no edits" rule is about source code; eval output is the eval driver's own contract.)
- No `.claude/plans/<slug>.md` file was written — intentionally, per the eval constraint "DO NOT mutate the repo" and because Open questions are unresolved.
- No tests, builds, formatters, or type-checkers were run. No `dotnet build`, no `dotnet test`, no `bun` commands.
- No background agents (`run_in_background: true`) were spawned. No subagents (Explore / general-purpose) were spawned.
- Investigation stayed light: only files implied by "the api" were read (`api.csproj`, `Program.cs`, `AnimalDbContext.cs`, both `appsettings*.json`, the integration-tests file, plus a glob of the migrations folder). No tour of `packages/web`, no read of unrelated modules.
- `ExitPlanMode` was NOT called, because the plan is not ready to be approved yet — Open questions block confident drafting. The skill explicitly says "If the task genuinely needs broader investigation, surface that under Open questions and ask the user — do not go fishing." This eval extends that principle: when the questions are about intent rather than code location, ask before persisting.
