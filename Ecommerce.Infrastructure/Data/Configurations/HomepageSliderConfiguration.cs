using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class HomepageSliderConfiguration : IEntityTypeConfiguration<HomepageSlider>
{
    public void Configure(EntityTypeBuilder<HomepageSlider> builder)
    {
        builder.ToTable("HomepageSliders");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ImageUrl).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.Badge).HasMaxLength(120);
        builder.Property(x => x.Eyebrow).HasMaxLength(160);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Highlight).HasMaxLength(160);
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.PrimaryButtonText).HasMaxLength(80);
        builder.Property(x => x.PrimaryButtonUrl).HasMaxLength(500);
        builder.Property(x => x.SecondaryButtonText).HasMaxLength(80);
        builder.Property(x => x.SecondaryButtonUrl).HasMaxLength(500);
        builder.HasIndex(x => new { x.IsActive, x.SortOrder });
    }
}
