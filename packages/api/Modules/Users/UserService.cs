using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Users;

public class UserService
{
    private readonly UserDbContext _db;

    public UserService(UserDbContext db)
    {
        _db = db;
    }

    public Task<List<User>> GetAllAsync(CancellationToken ct = default) =>
        _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .ToListAsync(ct);

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.UserLeaves).ThenInclude(ul => ul.Leave)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user is not null)
        {
            user.UserLeaves = user.UserLeaves.OrderBy(ul => ul.Leave.Name).ToList();
        }

        return user;
    }

    public async Task<User> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var roles = await _db.Roles
            .Where(r => request.RoleIds.Contains(r.Id))
            .ToListAsync(ct);

        if (roles.Count != request.RoleIds.Distinct().Count())
        {
            throw new ValidationException("Unknown role id");
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            IsActive = true,
        };

        foreach (var roleId in request.RoleIds.Distinct())
        {
            user.UserRoles.Add(new UserRole { RoleId = roleId });
        }

        var leaves = await _db.Leaves.ToListAsync(ct);
        var year = DateTime.UtcNow.Year;
        foreach (var leave in leaves)
        {
            user.UserLeaves.Add(new UserLeave
            {
                LeaveId = leave.Id,
                Year = year,
                TotalDays = leave.IsUnlimited ? null : leave.DefaultTotalDays,
                TakenDays = 0,
            });
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return (await GetByIdAsync(user.Id, ct))!;
    }

    public async Task<User?> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user is null) return null;

        var requestedIds = request.RoleIds.Distinct().ToList();
        var roles = await _db.Roles
            .Where(r => requestedIds.Contains(r.Id))
            .ToListAsync(ct);

        if (roles.Count != requestedIds.Count)
        {
            throw new ValidationException("Unknown role id");
        }

        user.Name = request.Name;
        user.Email = request.Email;
        user.IsActive = request.IsActive;

        var currentRoleIds = user.UserRoles.Select(ur => ur.RoleId).ToHashSet();
        var requestedRoleIds = requestedIds.ToHashSet();

        var toRemove = user.UserRoles.Where(ur => !requestedRoleIds.Contains(ur.RoleId)).ToList();
        foreach (var ur in toRemove)
        {
            user.UserRoles.Remove(ur);
        }

        foreach (var roleId in requestedRoleIds.Where(rid => !currentRoleIds.Contains(rid)))
        {
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId });
        }

        await _db.SaveChangesAsync(ct);

        return await GetByIdAsync(user.Id, ct);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync([id], ct);
        if (user is null) return false;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<UserLeave?> AddUserLeaveAsync(Guid userId, AddUserLeaveRequest request, CancellationToken ct = default)
    {
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId, ct);
        if (!userExists) return null;

        var leave = await _db.Leaves.FirstOrDefaultAsync(l => l.Id == request.LeaveId, ct);
        if (leave is null)
        {
            throw new ValidationException("Unknown leave id");
        }

        var year = DateTime.UtcNow.Year;

        var duplicate = await _db.UserLeaves
            .AnyAsync(ul => ul.UserId == userId && ul.LeaveId == request.LeaveId && ul.Year == year, ct);
        if (duplicate)
        {
            throw new ValidationException("Leave is already assigned to this user for the current year");
        }

        if (leave.IsUnlimited && request.TotalDays != null)
        {
            throw new ValidationException("TotalDays must be null for unlimited leave");
        }
        if (!leave.IsUnlimited && request.TotalDays == null)
        {
            throw new ValidationException("TotalDays is required for limited leave");
        }

        var userLeave = new UserLeave
        {
            UserId = userId,
            LeaveId = request.LeaveId,
            Year = year,
            TotalDays = request.TotalDays,
            TakenDays = 0,
        };

        _db.UserLeaves.Add(userLeave);
        await _db.SaveChangesAsync(ct);

        return await _db.UserLeaves
            .Include(ul => ul.Leave)
            .FirstAsync(ul => ul.Id == userLeave.Id, ct);
    }

    public async Task<UserLeave?> UpdateUserLeaveAsync(Guid userId, Guid userLeaveId, UpdateUserLeaveRequest request, CancellationToken ct = default)
    {
        var userLeave = await _db.UserLeaves
            .Include(ul => ul.Leave)
            .FirstOrDefaultAsync(ul => ul.Id == userLeaveId && ul.UserId == userId, ct);

        if (userLeave is null) return null;

        if (userLeave.Leave.IsUnlimited && request.TotalDays != null)
        {
            throw new ValidationException("TotalDays must be null for unlimited leave");
        }
        if (!userLeave.Leave.IsUnlimited && request.TotalDays == null)
        {
            throw new ValidationException("TotalDays is required for limited leave");
        }

        userLeave.TotalDays = request.TotalDays;
        await _db.SaveChangesAsync(ct);

        return userLeave;
    }
}
