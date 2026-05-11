using Api.Common.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Users;

public static class LeaveEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapApiGroup("leaves");

        group.MapGet("/", async (UserDbContext db, CancellationToken ct) =>
            TypedResults.Ok(await db.Leaves.ToListAsync(ct)));
    }
}
