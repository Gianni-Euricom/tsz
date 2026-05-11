using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Api.Modules.Users;

public class UserLeave
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    [JsonIgnore]
    public User User { get; set; } = null!;
    public Guid LeaveId { get; set; }
    public Leave Leave { get; set; } = null!;
    public int Year { get; set; }
    public int? TotalDays { get; set; }
    public int TakenDays { get; set; }

    [NotMapped]
    public int? BalanceDays => Leave?.IsUnlimited == true ? null : (TotalDays ?? 0) - TakenDays;
}
