# Add Users CRUD

## Goal

Add a **Users** feature end-to-end:

- **API** (`packages/api`, .NET 10 + EF Core): a new `Users` module mirroring `Animals` — entities, DbContext, contracts, service, endpoints, migration.
- **Web** (`packages/web`, TanStack Start): regenerated OpenAPI types, API client wrapper, three routes (list / create / detail+edit), nav link.

A `User` has `Name`, `Email`, `IsActive`, plus **many** `Roles` and **many** `Leaves`.

Roles are modelled as **two tables**:

1. **`Role`** — role lookup. Five seeded rows: `Consultant`, `Admin`, `SysAdmin`, `Financial controller`, `Client manager`.
2. **`UserRole`** — join table between `User` and `Role`. Composite key `(UserId, RoleId)`, no payload.

Leaves are modelled as **two tables**:

1. **`Leave`** — leave-type lookup. Four seeded rows: `Holiday`, `ADV`, `Anciënniteit`, `Sick`. Each row has `IsUnlimited` and `DefaultTotalDays`.
2. **`UserLeave`** — join table between `User` and `Leave`. Synthetic `Id` key, payload `Year`, `TotalDays?`, `TakenDays`.

### Seeding

At app startup, in order:

1. If `Roles` is empty, insert the five role rows.
2. If `Leaves` is empty, insert the four leave rows.
3. If `Users` is empty, insert ~5 sample users via `UserService.CreateAsync` (so they get their join rows). Flip one to `IsActive = false`.

`UserService.CreateAsync` accepts a list of `RoleIds` in the request and creates `UserRole` rows. It also creates a `UserLeave` for **every** existing `Leave` row using `Year = DateTime.UtcNow.Year`, `TotalDays = leave.DefaultTotalDays`, `TakenDays = 0`.

### Seed values

| Role table           | Leave table  | IsUnlimited | DefaultTotalDays |
| -------------------- | ------------ | ----------- | ---------------- |
| Consultant           | Holiday      | false       | 20               |
| Admin                | ADV          | false       | 5                |
| SysAdmin             | Anciënniteit | false       | 0                |
| Financial controller | Sick         | true        | null             |
| Client manager       |              |             |                  |

### Page layout

The user detail page shows the user's roles as a comma-separated list (and as multi-select checkboxes when editing), and the user's `UserLeaves` in a table with columns **Name | Allowed | Year | Total days | Taken days | Balance days**. Unlimited rows leave Total and Balance blank (`""`). Limited rows show all six, e.g. `ADV | Limited | 2026 | 5 | 3 | 2`.

**Entity ids are never rendered to the user** — no `id` column in the list, no `#{user.id}` badge on the detail page, no row id in the leaves table. Ids are still used internally (route params, request bodies, React keys); they just must not appear in any visible UI element.

**Taken days and Balance days are calculated, not user-edited.** They are displayed read-only on the detail page. Only **Total days** is editable, and only on **limited** rows. The API request DTOs for adding / updating a `UserLeave` therefore do not accept a `TakenDays` value; the server pins it to `0` on creation and leaves it untouched on update.

### Editing and adding leaves on the detail page

- **Edit a row**: only **limited** rows have a per-row Edit button. The form lets the admin edit **Total days** only. Unlimited rows have no Edit button (nothing meaningful to edit — Total stays `null`, Taken and Balance are calculated).
- **Add a leave row**: below the table, an "Add leave" control lets an admin pick a leave type that is **not yet assigned to this user for the current year** and create a new `UserLeave` for them. Total days defaults to the type's `DefaultTotalDays` (editable for limited, hidden for unlimited). Taken days is not user-input — the server pins it to `0`. If every leave type is already assigned, the control is hidden.

## Affected areas

### File tree — new on the API side

```
packages/api/
├── Modules/
│   └── Users/                          ← all of this is NEW
│       ├── User.cs                       entity
│       ├── Role.cs                       entity
│       ├── UserRole.cs                   join entity (no payload)
│       ├── Leave.cs                      entity
│       ├── UserLeave.cs                  join entity (with payload)
│       ├── UserConfiguration.cs          EF type config
│       ├── RoleConfiguration.cs          EF type config
│       ├── UserRoleConfiguration.cs      EF type config
│       ├── LeaveConfiguration.cs         EF type config
│       ├── UserLeaveConfiguration.cs     EF type config
│       ├── UserDbContext.cs              exposes 5 DbSets
│       ├── UserContracts.cs              CreateUserRequest, UpdateUserRequest,
│       │                                 AddUserLeaveRequest, UpdateUserLeaveRequest
│       ├── UserService.cs                service layer
│       ├── UserEndpoints.cs              minimal API endpoint registration (users)
│       ├── RoleEndpoints.cs              minimal API endpoint registration (roles)
│       └── LeaveEndpoints.cs             minimal API endpoint registration (leaves)
└── Migrations/
    ├── <timestamp>_AddUsers.cs           generated by `dotnet ef migrations add`
    ├── <timestamp>_AddUsers.Designer.cs  generated
    └── UserDbContextModelSnapshot.cs     generated
```

Note: there is **no `UserRole` enum**. Role identity comes from rows in the `Roles` table.

### File tree — modified on the API side

```
packages/api/
└── Program.cs            register UserDbContext + UserService, call UserEndpoints.Map(app),
                          RoleEndpoints.Map(app), LeaveEndpoints.Map(app),
                          seed Roles, Leaves, then sample Users.
```

### File tree — new on the web side

```
packages/web/src/
├── api/
│   ├── users.ts          typed client wrapper
│   └── users.spec.ts     unit tests
└── routes/
    └── users/            ← new folder
        ├── index.tsx     list page (/users)
        ├── new.tsx       create page (/users/new)
        └── $id.tsx       detail/edit page (/users/$id), incl. leaves table + add-leave control
```

### File tree — modified on the web side

```
packages/web/src/
├── api/
│   └── schema.ts         regenerated by `bun gen:api` — DO NOT edit by hand
└── routes/
    └── __root.tsx        add Users nav link next to Animals
```

## Approach

### Part A — API: entities and database

All Users-module primary keys and foreign keys are `Guid`. (Animals stay `int` for now.) EF Core generates Guid values client-side on insert via the default `SequentialGuidValueGenerator`, so entities never set `Id` explicitly.

**Step 1 — `User.cs`.**

- `Guid Id`
- `string Name = ""`
- `string Email = ""`
- `bool IsActive = true`
- `List<UserRole> UserRoles = new()`
- `List<UserLeave> UserLeaves = new()`

**Step 2 — `Role.cs`.**

- `Guid Id`
- `string Name`

**Step 3 — `UserRole.cs`.**

Composite key — no payload, no synthetic id.

- `Guid UserId`, `User User = null!` (back-ref `[JsonIgnore]`)
- `Guid RoleId`, `Role Role = null!`

**Step 4 — `Leave.cs`.**

- `Guid Id`
- `string Name`
- `bool IsUnlimited`
- `int? DefaultTotalDays`

**Step 5 — `UserLeave.cs`.**

Synthetic key (has payload).

- `Guid Id`
- `Guid UserId`, `User User = null!` (back-ref `[JsonIgnore]`)
- `Guid LeaveId`, `Leave Leave = null!`
- `int Year`
- `int? TotalDays`
- `int TakenDays`
- `[NotMapped] int? BalanceDays => Leave?.IsUnlimited == true ? null : (TotalDays ?? 0) - TakenDays;`

**Step 6 — EF configurations.**

`UserConfiguration.cs`:

- Table `"Users"`.
- `Name` required, `MaxLength(100)`.
- `Email` required, `MaxLength(200)`.
- `IsActive` required, `.HasDefaultValue(true)`.

`RoleConfiguration.cs`:

- Table `"Roles"`.
- `Name` required, `MaxLength(100)`, unique index.

`UserRoleConfiguration.cs`:

- Table `"UserRoles"`.
- Composite primary key: `HasKey(ur => new { ur.UserId, ur.RoleId })`.
- FK to `User`: cascade delete.
- FK to `Role`: restrict delete.

`LeaveConfiguration.cs`:

- Table `"Leaves"`.
- `Name` required, `MaxLength(100)`, unique index.
- `IsUnlimited` required.
- `DefaultTotalDays` nullable.

`UserLeaveConfiguration.cs`:

- Table `"UserLeaves"`.
- FK to `User`: cascade delete.
- FK to `Leave`: restrict delete.
- `Year`, `TakenDays` required. `TotalDays` nullable.
- Unique composite index on `(UserId, LeaveId, Year)`.

**Step 7 — `UserDbContext.cs`.**
Mirror `AnimalDbContext`. Expose:

```
public DbSet<User> Users => Set<User>();
public DbSet<Role> Roles => Set<Role>();
public DbSet<UserRole> UserRoles => Set<UserRole>();
public DbSet<Leave> Leaves => Set<Leave>();
public DbSet<UserLeave> UserLeaves => Set<UserLeave>();
```

Apply the five configurations in `OnModelCreating`.

**Step 8 — `UserContracts.cs`.**

```
public class CreateUserRequest
{
    [Required, StringLength(100)]
    public string Name { get; set; } = "";

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = "";

    [Required, MinLength(1)]
    public List<Guid> RoleIds { get; set; } = new();
}

public class UpdateUserRequest
{
    [Required, StringLength(100)]
    public string Name { get; set; } = "";

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = "";

    public bool IsActive { get; set; }

    [Required, MinLength(1)]
    public List<Guid> RoleIds { get; set; } = new();
}

public class AddUserLeaveRequest
{
    [Required]
    public Guid LeaveId { get; set; }

    [Range(0, 365)]
    public int? TotalDays { get; set; }
}

public class UpdateUserLeaveRequest
{
    [Range(0, 365)]
    public int? TotalDays { get; set; }
}
```

`AddUserLeaveRequest` does not include `Year` — the server pins it to `DateTime.UtcNow.Year`.

### Part B — API: service and endpoints

**Step 9 — `UserService.cs`.**
Constructor takes `UserDbContext`. Methods:

- `GetAllAsync(ct)` — list with `Include(u => u.UserRoles).ThenInclude(ur => ur.Role)`. Do **not** include `UserLeaves`.

- `GetByIdAsync(Guid id, ct)`:

  ```
  _db.Users
     .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
     .Include(u => u.UserLeaves).ThenInclude(ul => ul.Leave)
     .FirstOrDefaultAsync(u => u.Id == id, ct);
  ```

  Order `UserLeaves` by `Leave.Name`.

- `CreateAsync(CreateUserRequest req, ct)`:
  1. Validate every `req.RoleIds` exists: `var roles = await _db.Roles.Where(r => req.RoleIds.Contains(r.Id)).ToListAsync(ct);` — if `roles.Count != req.RoleIds.Count` throw `ValidationException("Unknown role id")`.
  2. Build `User { Name, Email, IsActive = true }`.
  3. For each `roleId` in `req.RoleIds`: `user.UserRoles.Add(new UserRole { RoleId = roleId });`
  4. `var leaves = await _db.Leaves.ToListAsync(ct);`
  5. For each `leave`: `user.UserLeaves.Add(new UserLeave { LeaveId = leave.Id, Year = DateTime.UtcNow.Year, TotalDays = leave.IsUnlimited ? null : leave.DefaultTotalDays, TakenDays = 0 });`
  6. `_db.Users.Add(user); await _db.SaveChangesAsync(ct);`
  7. Re-query with the full `Include` chain. Return it.

- `UpdateAsync(Guid id, UpdateUserRequest req, ct)`:
  1. Load: `_db.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id, ct);`
  2. Return `null` if not found.
  3. Validate `req.RoleIds` exist (same check as create).
  4. Update `Name`, `Email`, `IsActive`.
  5. Replace `UserRoles`: remove rows whose `RoleId` is not in `req.RoleIds`, add rows for `RoleId`s not already present. Don't `.Clear()`+re-add.
  6. `SaveChangesAsync`. Return the re-queried user (full `Include`).

- `DeleteAsync(Guid id, ct)` — same shape as `AnimalService.DeleteAsync`. Join rows cascade.

- `AddUserLeaveAsync(Guid userId, AddUserLeaveRequest req, ct)`:
  1. Verify the user exists. Return `null` if not.
  2. Load the leave type: `var leave = await _db.Leaves.FirstOrDefaultAsync(l => l.Id == req.LeaveId, ct);` — throw `ValidationException("Unknown leave id")` if null.
  3. `var year = DateTime.UtcNow.Year;`
  4. Conflict check: if `await _db.UserLeaves.AnyAsync(ul => ul.UserId == userId && ul.LeaveId == req.LeaveId && ul.Year == year, ct)` → throw `ValidationException("Leave is already assigned to this user for the current year")`.
  5. Validate `TotalDays`: if `leave.IsUnlimited` and `req.TotalDays != null` → throw `ValidationException("TotalDays must be null for unlimited leave")`. If `!leave.IsUnlimited` and `req.TotalDays == null` → throw `ValidationException("TotalDays is required for limited leave")`.
  6. Insert: `_db.UserLeaves.Add(new UserLeave { UserId = userId, LeaveId = req.LeaveId, Year = year, TotalDays = req.TotalDays, TakenDays = 0 });` then `SaveChangesAsync`.
  7. Return the inserted `UserLeave` re-queried with `Include(ul => ul.Leave)`.

- `UpdateUserLeaveAsync(Guid userId, Guid userLeaveId, UpdateUserLeaveRequest req, ct)`:
  1. Load: `_db.UserLeaves.Include(ul => ul.Leave).FirstOrDefaultAsync(ul => ul.Id == userLeaveId && ul.UserId == userId, ct);`
  2. Return `null` if not found.
  3. If `ul.Leave.IsUnlimited` and `req.TotalDays != null` → throw `ValidationException("TotalDays must be null for unlimited leave")`.
  4. If `!ul.Leave.IsUnlimited` and `req.TotalDays == null` → throw `ValidationException("TotalDays is required for limited leave")`.
  5. Apply `TotalDays` only (do not touch `TakenDays`), save, return.

**Step 10 — `UserEndpoints.cs`.**
Mirror `AnimalEndpoints.cs`. Use `app.MapApiGroup("users")`. Routes:

| Method | Path                                     | Validation filter                          |
| ------ | ---------------------------------------- | ------------------------------------------ |
| GET    | `/`                                      | —                                          |
| GET    | `/{id:guid}`                                | —                                          |
| POST   | `/`                                         | `ValidationFilter<CreateUserRequest>`      |
| PUT    | `/{id:guid}`                                | `ValidationFilter<UpdateUserRequest>`      |
| DELETE | `/{id:guid}`                                | —                                          |
| POST   | `/{userId:guid}/leaves`                     | `ValidationFilter<AddUserLeaveRequest>`    |
| PUT    | `/{userId:guid}/leaves/{userLeaveId:guid}`  | `ValidationFilter<UpdateUserLeaveRequest>` |

The `{userLeaveId}` in the URL is `UserLeave.Id` (not `Leave.Id`).

Use `Results.Ok(...)` / `Results.NotFound()` / `Results.NoContent()` / `Results.Created(...)`. For `POST /{userId}/leaves`, on success return `Results.Created($"/api/users/{userId}/leaves/{newUserLeave.Id}", newUserLeave)`. Wrap service calls that can throw `ValidationException` in `try/catch` and return `Results.BadRequest(new { error = ex.Message })`.

**Step 11 — `RoleEndpoints.cs`.**

| Method | Path         | Notes                                |
| ------ | ------------ | ------------------------------------ |
| GET    | `/api/roles` | Returns `List<Role>`. Group: `roles` |

**Step 12 — `LeaveEndpoints.cs`.**

| Method | Path          | Notes                                  |
| ------ | ------------- | -------------------------------------- |
| GET    | `/api/leaves` | Returns `List<Leave>`. Group: `leaves` |

The web add-leave control needs this to know which leave types exist.

**Step 13 — `Program.cs` wiring.**
Near the existing animal lines:

- `builder.Services.AddDbContext<UserDbContext>(o => o.UseSqlite(builder.Configuration.GetConnectionString("UsersConnection") ?? "Data Source=users.db"));`
- `builder.Services.AddScoped<UserService>();`
- `UserEndpoints.Map(app);`, `RoleEndpoints.Map(app);`, `LeaveEndpoints.Map(app);` next to `AnimalEndpoints.Map(app);`.

Seed block (after the animals seed block):

```
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    db.Database.EnsureCreated();

    if (!await db.Roles.AnyAsync())
    {
        db.Roles.AddRange(
            new Role { Name = "Consultant" },
            new Role { Name = "Admin" },
            new Role { Name = "SysAdmin" },
            new Role { Name = "Financial controller" },
            new Role { Name = "Client manager" }
        );
        await db.SaveChangesAsync();
    }

    if (!await db.Leaves.AnyAsync())
    {
        db.Leaves.AddRange(
            new Leave { Name = "Holiday",      IsUnlimited = false, DefaultTotalDays = 20 },
            new Leave { Name = "ADV",          IsUnlimited = false, DefaultTotalDays = 5 },
            new Leave { Name = "Anciënniteit", IsUnlimited = false, DefaultTotalDays = 0 },
            new Leave { Name = "Sick",         IsUnlimited = true,  DefaultTotalDays = null }
        );
        await db.SaveChangesAsync();
    }

    if (!await db.Users.AnyAsync())
    {
        var service = scope.ServiceProvider.GetRequiredService<UserService>();
        var roleIds = await db.Roles.Select(r => r.Id).ToListAsync();
        // create ~5 sample users via service.CreateAsync, varying assigned roleIds.
        // flip one to IsActive=false via service.UpdateAsync.
    }
}
```

Roles and Leaves must exist before users — `CreateAsync` reads both.

**Step 14 — EF migration.**
From `packages/api`:

```
dotnet ef migrations add AddUsers --context UserDbContext
```

Check in everything it generates under `Migrations/`.

### Part C — Web: types and client

**Step 15 — Regenerate the schema.**
With Part B complete:

1. `dotnet run --project packages/api` in one terminal.
2. In another terminal, in `packages/web`: `bun gen:api`.

`schema.ts` then contains paths `/api/users`, `/api/users/{id}`, `/api/users/{userId}/leaves`, `/api/users/{userId}/leaves/{userLeaveId}`, `/api/roles`, `/api/leaves` and components `User`, `Role`, `UserRole`, `Leave`, `UserLeave`, `CreateUserRequest`, `UpdateUserRequest`, `AddUserLeaveRequest`, `UpdateUserLeaveRequest`. `User.userRoles` is `UserRole[]` with nested `role: Role`. `User.userLeaves` is `UserLeave[]` with nested `leave: Leave`.

**Step 16 — `src/api/users.ts`.**
Mirror `src/api/animals.ts` style. Export:

- DTO aliases: `UserDTO`, `RoleDTO`, `UserRoleDTO`, `LeaveDTO`, `UserLeaveDTO`, `CreateUserRequestDTO`, `UpdateUserRequestDTO`, `AddUserLeaveRequestDTO`, `UpdateUserLeaveRequestDTO`.
- `User` alias = `UserDTO`.
- Functions:
  - `getUsers(): Promise<User[]>`
  - `getUserById(id): Promise<User>`
  - `createUser(body): Promise<User>`
  - `updateUser(id, body): Promise<void>`
  - `removeUser(id): Promise<void>`
  - `addUserLeave(userId, body): Promise<UserLeave>`
  - `updateUserLeave(userId, userLeaveId, body): Promise<void>`
  - `getRoles(): Promise<Role[]>`
  - `getLeaves(): Promise<Leave[]>`

### Part D — Web: routes and UI

**Step 17 — List page (`src/routes/users/index.tsx`).**
Copy `routes/animals/index.tsx`:

- `createServerFn` `fetchUsers` calling `getUsers()`.
- `createFileRoute('/users/')({ loader, component })`.
- `Table` with columns **Name | Email | Roles | Status**.
  - **Roles**: `user.userRoles.map(ur => ur.role.name).join(', ')`.
  - **Status**: `"Active"` or `"Inactive"`. Apply `text-muted-foreground` to the whole row when `!user.isActive`.
- Above the table, a `<Button asChild>` with `<Link to="/users/new">New user</Link>` aligned right.
- Each row clickable: `onClick={() => navigate({ to: '/users/$id', params: { id: String(user.id) } })}`.

**Step 18 — Create page (`src/routes/users/new.tsx`).**

- Loader fetches `getRoles()` for the role checklist.
- Zod schema: `name` 1–100, `email` valid + ≤200, `roleIds` `z.array(z.number().int()).min(1)`.
- `createServerFn({ method: 'POST' })` validating with that schema and calling `createUser(...)`. Returns the new user.
- Form layout (steal scaffolding from `animals/$id.tsx`'s `EditForm`):
  - Name `<Input type="text">`
  - Email `<Input type="email">`
  - Roles — one `<Checkbox>` per role from loader data. Bind to a `roleIds` array field.
- After submit: `navigate({ to: '/users/$id', params: { id: String(created.id) } })`.
- `formatFieldErrors`, `<Card><CardContent>` layout, Save/Cancel buttons. Cancel → `/users`.

**Step 19 — Detail/edit page (`src/routes/users/$id.tsx`).**

Loader returns `{ user: await getUserById(id), roles: await getRoles(), leaves: await getLeaves() }` (parallelize with `Promise.all`). `roles` populates the role checklist; `leaves` populates the add-leave dropdown.

Sections top-to-bottom:

1. **Back link** — `<Link to="/users">Back to users</Link>`.

2. **User card** — `<Card><CardContent>`. Same `isEditing` toggle as animals: `ReadView` ↔ `EditForm`. Neither view renders `user.id` — no `#123` badge in the header.
   - `ReadView`: Name / Email / Roles (comma-separated names) / Status.
   - `EditForm`: Name, Email, `IsActive` checkbox, Roles (multi-select checkboxes built from `roles` loader data, defaulted to the user's current `roleIds`). Submit calls `saveUser` `createServerFn` wrapping `updateUser`, then `router.invalidate()`.

3. **Leaves card** — second `<Card>` with a `<Table>`. Render `user.userLeaves`. Columns **Name | Allowed | Year | Total days | Taken days | Balance days | (actions)**:
   - **Name**: `ul.leave.name`.
   - **Allowed**: `ul.leave.isUnlimited ? "Unlimited" : "Limited"`.
   - **Year**: `ul.year`.
   - **Total days**: `""` when unlimited, else `ul.totalDays`.
   - **Taken days**: `ul.takenDays`.
   - **Balance days**: `""` when unlimited, else `ul.balanceDays` (use server value).
   - **Actions**: per-row "Edit" button.

   **Per-row edit.** `useState<number | null>(editingId)` in the page. Only **limited** rows render an Edit button (unlimited rows have nothing user-editable). When Edit is clicked, that row's Total days cell becomes a `<Input type="number">`, Zod-validated `int 0–365`. Taken days and Balance days stay as plain text. Save / Cancel replace the Edit button.
   - On Save: call `saveUserLeave` server fn wrapping `updateUserLeave(userId, userLeaveId, { totalDays })`, then `await router.invalidate()` and clear `editingId`.

4. **Add-leave control** — directly below the leaves table inside the same `<Card>`. Build it like this:
   - Compute `availableLeaves = leaves.filter(l => !user.userLeaves.some(ul => ul.leaveId === l.id))`. (Scope: current year — current behavior is that all existing UserLeaves are current-year; we don't expose a year picker here.)
   - If `availableLeaves.length === 0`, render nothing.
   - Otherwise render an inline form:
     - A `<Select>` (use the Radix-based UI primitive already used in the project) listing `availableLeaves.map(l => ({ value: String(l.id), label: l.name }))`. Empty by default.
     - When a leave is selected, derive `selectedLeave = leaves.find(l => l.id === selectedId)`. Show:
       - **TotalDays** `<Input type="number">` — only when `!selectedLeave.isUnlimited`. Default value: `selectedLeave.defaultTotalDays ?? 0`. Zod `int 0–365`.
     - An "Add" `<Button>`.
   - Taken days is not part of the form — the server pins it to `0`.
   - On Add: call `addUserLeaveFn` `createServerFn` wrapping `addUserLeave(userId, { leaveId: selectedId, totalDays: selectedLeave.isUnlimited ? null : totalDays })`. After success, `await router.invalidate()` (the loader re-runs, the new row appears in the table, and `availableLeaves` shrinks by one) and reset the form state.
   - Show inline error text if the server returns 400 (e.g. conflict).

Mirror the verbose `form.Field` style from `animals/$id.tsx` for both the edit and add forms.

**Step 20 — Nav link.**
In `src/routes/__root.tsx`, in the `<nav>` div:

```tsx
<Button asChild variant="ghost" size="sm">
  <Link to="/users" className="[&.active]:font-bold">
    Users
  </Link>
</Button>
```

**Step 21 — Tests (`src/api/users.spec.ts`).**
Mirror `src/api/animals.spec.ts`. For each of the nine client functions (`getUsers`, `getUserById`, `createUser`, `updateUser`, `removeUser`, `addUserLeave`, `updateUserLeave`, `getRoles`, `getLeaves`), assert method, URL (including both path params on `updateUserLeave`), body for POST/PUT, and `404`/`500` → `ApiRequestError`. Reuse `jsonResponse` / `emptyResponse` from `@tests/fetch-util`.

## Out of scope

- Auth / authorization on user endpoints.
- Pagination / search / filtering on the list page.
- CRUD for `Role` or `Leave` types — both seeded once at startup, no API mutation surface.
- Removing a `UserLeave` row (no DELETE endpoint for the join; once added, edit-only).
- Auto-creating `UserLeave` rows for new calendar years.
- Letting the admin set an arbitrary `Year` when adding a leave — `Year` is pinned to `DateTime.UtcNow.Year`.
- Updating `src/routes/animals/*` to the new unwrapped `animals.ts` signatures.

## Open questions

- None.

## Validation strategy

- `dotnet build packages/api/api.csproj` succeeds.
- `dotnet test packages/api.tests` passes.
- `dotnet test packages/api.tests.integration` passes.
- API runs (`dotnet run --project packages/api`) and `GET http://localhost:5204/openapi/v1.json` contains:
  - Paths: `/api/users`, `/api/users/{id}`, `/api/users/{userId}/leaves`, `/api/users/{userId}/leaves/{userLeaveId}`, `/api/roles`, `/api/leaves`.
  - Components: `User`, `Role`, `UserRole`, `Leave`, `UserLeave`, `CreateUserRequest`, `UpdateUserRequest`, `AddUserLeaveRequest`, `UpdateUserLeaveRequest`.
  - `User.userRoles` references `UserRole[]` with nested `role: Role`.
  - `User.userLeaves` references `UserLeave[]` with nested `leave: Leave`.
- In `packages/web`, `bun gen:api` succeeds.
- `bun check` in `packages/web` passes.
- `bun test src/api/users.spec.ts` passes.
- Manual smoke test in the running app:
  1. Visit `/users` — seeded users render with roles in the Roles column; the inactive one is muted.
  2. Click **New user**, fill in fields, tick at least one role, submit. Land on `/users/$id`. Leaves table shows: Holiday Limited 20/0/20, ADV Limited 5/0/5, Anciënniteit Limited 0/0/0, Sick Unlimited "" /0/"". The add-leave control is hidden because all four types are already assigned.
  3. Edit user → tick an extra role + toggle `IsActive` off → save → list shows muted row with the updated role list.
  4. Edit ADV row → set Total=7 → save → Balance becomes `7 − takenDays`.
  5. Sick row (Unlimited) has no Edit button — Total/Balance stay blank, Taken stays at its calculated value.
  6. (Forward-compatibility check.) Insert an extra `Leave` row in the DB by hand (e.g. `Parental, IsUnlimited=false, DefaultTotalDays=15`). Reload `/users/$id` — the add-leave control appears with `Parental` selectable. Pick it, leave the default total of 15, click Add → a new row appears in the table with TakenDays=0, control hides itself again.
  7. Try POSTing `/api/users/{id}/leaves` with a duplicate `leaveId` → 400 with `error: "Leave is already assigned to this user for the current year"`.
