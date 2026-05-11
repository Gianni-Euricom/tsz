namespace Api.Modules.Users;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<UserRole> UserRoles { get; set; } = new();
    public List<UserLeave> UserLeaves { get; set; } = new();
}
