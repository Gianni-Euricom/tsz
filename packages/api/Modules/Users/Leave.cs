namespace Api.Modules.Users;

public class Leave
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsUnlimited { get; set; }
    public int? DefaultTotalDays { get; set; }
}
