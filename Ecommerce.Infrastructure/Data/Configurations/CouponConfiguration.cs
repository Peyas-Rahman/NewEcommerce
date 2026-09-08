using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(40);
        builder.Property(x => x.DiscountType).IsRequired().HasMaxLength(20);
        builder.Property(x => x.DiscountValue).HasPrecision(18, 2);
        builder.Property(x => x.MinimumOrderAmount).HasPrecision(18, 2);
        builder.Property(x => x.MaximumDiscountAmount).HasPrecision(18, 2);
        builder.HasIndex(x => x.Code).IsUnique().HasFilter("[IsDeleted] = 0");
    }
}
