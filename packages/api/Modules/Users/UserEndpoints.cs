using System.ComponentModel.DataAnnotations;
using Api.Common.Extensions;
using Api.Common.Filters;

namespace Api.Modules.Users;

public static class UserEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapApiGroup("users");

        group.MapGet("/", async (UserService service, CancellationToken ct) =>
            TypedResults.Ok(await service.GetAllAsync(ct)));

        group.MapGet("/{id:guid}", async (Guid id, UserService service, CancellationToken ct) =>
        {
            var user = await service.GetByIdAsync(id, ct);
            return user is not null
                ? Results.Ok(user)
                : Results.NotFound();
        });

        group.MapPost("/", async (CreateUserRequest request, UserService service, CancellationToken ct) =>
        {
            try
            {
                var user = await service.CreateAsync(request, ct);
                return Results.Created($"/api/users/{user.Id}", user);
            }
            catch (ValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        }).AddEndpointFilter<ValidationFilter<CreateUserRequest>>();

        group.MapPut("/{id:guid}", async (Guid id, UpdateUserRequest request, UserService service, CancellationToken ct) =>
        {
            try
            {
                var user = await service.UpdateAsync(id, request, ct);
                return user is not null
                    ? Results.Ok(user)
                    : Results.NotFound();
            }
            catch (ValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        }).AddEndpointFilter<ValidationFilter<UpdateUserRequest>>();

        group.MapDelete("/{id:guid}", async (Guid id, UserService service, CancellationToken ct) =>
        {
            return await service.DeleteAsync(id, ct)
                ? Results.NoContent()
                : Results.NotFound();
        });

        group.MapPost("/{userId:guid}/leaves", async (Guid userId, AddUserLeaveRequest request, UserService service, CancellationToken ct) =>
        {
            try
            {
                var userLeave = await service.AddUserLeaveAsync(userId, request, ct);
                return userLeave is not null
                    ? Results.Created($"/api/users/{userId}/leaves/{userLeave.Id}", userLeave)
                    : Results.NotFound();
            }
            catch (ValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        }).AddEndpointFilter<ValidationFilter<AddUserLeaveRequest>>();

        group.MapPut("/{userId:guid}/leaves/{userLeaveId:guid}", async (Guid userId, Guid userLeaveId, UpdateUserLeaveRequest request, UserService service, CancellationToken ct) =>
        {
            try
            {
                var userLeave = await service.UpdateUserLeaveAsync(userId, userLeaveId, request, ct);
                return userLeave is not null
                    ? Results.Ok(userLeave)
                    : Results.NotFound();
            }
            catch (ValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        }).AddEndpointFilter<ValidationFilter<UpdateUserLeaveRequest>>();
    }
}
