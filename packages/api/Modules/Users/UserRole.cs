using System.Text.Json.Serialization;

namespace Api.Modules.Users;

public class UserRole
{
    public Guid UserId { get; set; }
    [JsonIgnore]
    public User User { get; set; } = null!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}
