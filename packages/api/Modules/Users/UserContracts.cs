using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Users;

public class CreateUserRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public List<Guid> RoleIds { get; set; } = new();
}

public class UpdateUserRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    [Required]
    [MinLength(1)]
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
