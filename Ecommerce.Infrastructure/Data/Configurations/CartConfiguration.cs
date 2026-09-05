using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class CartConfiguration
    : IEntityTypeConfiguration<Cart>
{
    public void Configure(
        EntityTypeBuilder<Cart> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.GuestToken)
            .HasMaxLength(100);

        builder.Property(x => x.IsActive)
            .IsRequired();

        // Customer → Carts
        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        // One active cart per customer
        builder.HasIndex(x => x.CustomerId)
            .IsUnique()
            .HasFilter("[CustomerId] IS NOT NULL");

        // Guest token lookup
        builder.HasIndex(x => x.GuestToken)
            .IsUnique()
            .HasFilter("[GuestToken] IS NOT NULL");
    }
}