using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Modules.Users;

public class UserLeaveConfiguration : IEntityTypeConfiguration<UserLeave>
{
    public void Configure(EntityTypeBuilder<UserLeave> builder)
    {
        builder.ToTable("UserLeaves");

        builder.HasKey(ul => ul.Id);

        builder.HasOne(ul => ul.User)
            .WithMany(u => u.UserLeaves)
            .HasForeignKey(ul => ul.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ul => ul.Leave)
            .WithMany()
            .HasForeignKey(ul => ul.LeaveId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(ul => ul.Year)
            .IsRequired();

        builder.Property(ul => ul.TakenDays)
            .IsRequired();

        builder.Property(ul => ul.TotalDays);

        builder.HasIndex(ul => new { ul.UserId, ul.LeaveId, ul.Year }).IsUnique();
    }
}
