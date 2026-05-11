using System.Reflection;
using System.Text.Json.Serialization;
using Api.Modules.Animals;
using Api.Modules.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<AnimalDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
           ?? "Data Source=animals.db");
});
builder.Services.AddScoped<AnimalService>();
builder.Services.AddDbContext<UserDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("UsersConnection")
           ?? "Data Source=users.db");
});
builder.Services.AddScoped<UserService>();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});
builder.Services.AddOpenApi(options =>
{
    options.AddSchemaTransformer((schema, _, _) =>
    {
        if (schema.Properties is { Count: > 0 })
        {
            schema.Required ??= new HashSet<string>();
            foreach (var (name, property) in schema.Properties)
            {
                var isNullable = property.Type is { } t && (t & JsonSchemaType.Null) != 0;
                if (!isNullable)
                {
                    schema.Required.Add(name);
                }
            }
        }
        return Task.CompletedTask;
    });
});
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AnimalDbContext>();
    db.Database.EnsureCreated();

    if (!await db.Animals.AnyAsync())
    {
        var species = new[]
        {
            "Dog", "Cat", "Rabbit", "Hamster", "Parrot",
            "Turtle", "Goldfish", "Horse", "Cow", "Sheep"
        };
        var names = new[]
        {
            "Bella", "Max", "Luna", "Charlie", "Lucy", "Cooper", "Daisy", "Milo",
            "Bailey", "Sadie", "Buddy", "Molly", "Rocky", "Zoe", "Jack", "Lily",
            "Toby", "Ruby", "Duke", "Rosie"
        };

        var random = new Random(42);
        var animals = Enumerable.Range(0, 100).Select(i => new Animal
        {
            Name = $"{names[random.Next(names.Length)]} {i + 1}",
            Species = species[random.Next(species.Length)],
            Age = random.Next(0, 21)
        });

        await db.Animals.AddRangeAsync(animals);
        await db.SaveChangesAsync();
    }
}

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
        var roleByName = await db.Roles.ToDictionaryAsync(r => r.Name);

        var samples = new (string Name, string Email, string[] Roles)[]
        {
            ("Alice Janssens",   "alice@example.com",   new[] { "Consultant" }),
            ("Bram De Vos",      "bram@example.com",    new[] { "Consultant", "Client manager" }),
            ("Chloé Peeters",    "chloe@example.com",   new[] { "Admin" }),
            ("Dieter Vermeulen", "dieter@example.com",  new[] { "SysAdmin" }),
            ("Eva Maes",         "eva@example.com",     new[] { "Financial controller", "Admin" })
        };

        User? lastCreated = null;
        foreach (var (name, email, roleNames) in samples)
        {
            var roleIds = roleNames.Select(rn => roleByName[rn].Id).ToList();
            lastCreated = await service.CreateAsync(new CreateUserRequest
            {
                Name = name,
                Email = email,
                RoleIds = roleIds,
            });
        }

        if (lastCreated is not null)
        {
            await service.UpdateAsync(lastCreated.Id, new UpdateUserRequest
            {
                Name = lastCreated.Name,
                Email = lastCreated.Email,
                IsActive = false,
                RoleIds = lastCreated.UserRoles.Select(ur => ur.RoleId).ToList(),
            });
        }
    }
}

// app.UseHttpsRedirection();
app.MapOpenApi("/openapi/{documentName}.json");
app.MapScalarApiReference("/openapi", options =>
{
    options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
});

app.MapGet("/", () => new
{
    name = "Animal API",
    version = Assembly.GetExecutingAssembly().GetName().Version?.ToString()
});

AnimalEndpoints.Map(app);
UserEndpoints.Map(app);
RoleEndpoints.Map(app);
LeaveEndpoints.Map(app);

app.Run();
