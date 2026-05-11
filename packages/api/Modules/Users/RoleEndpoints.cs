using Api.Common.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Users;

public static class RoleEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapApiGroup("roles");

        group.MapGet("/", async (UserDbContext db, CancellationToken ct) =>
            TypedResults.Ok(await db.Roles.ToListAsync(ct)));
    }
}
