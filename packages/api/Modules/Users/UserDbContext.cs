using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Users;

public class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Leave> Leaves => Set<Leave>();
    public DbSet<UserLeave> UserLeaves => Set<UserLeave>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RoleConfiguration());
        modelBuilder.ApplyConfiguration(new UserRoleConfiguration());
        modelBuilder.ApplyConfiguration(new LeaveConfiguration());
        modelBuilder.ApplyConfiguration(new UserLeaveConfiguration());
    }
}
