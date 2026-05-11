using System.Reflection;
using System.Text.Json.Serialization;
using Api.Modules.Animals;
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

app.Run();
