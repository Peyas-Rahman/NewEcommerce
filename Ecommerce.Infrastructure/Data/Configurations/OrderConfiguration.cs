using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class OrderConfiguration
    : IEntityTypeConfiguration<Order>
{
    public void Configure(
        EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.OrderNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(x => x.OrderNumber)
            .IsUnique();

        builder.Property(x => x.SubTotal)
            .HasPrecision(18, 2);

        builder.Property(x => x.DiscountAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.ShippingAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.TaxAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.GrandTotal)
            .HasPrecision(18, 2);

        builder.Property(x => x.OrderStatus)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.PaymentStatus)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.PaymentMethod)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.GuestName)
            .HasMaxLength(150);

        builder.Property(x => x.GuestPhone)
            .HasMaxLength(20);

        builder.Property(x => x.GuestEmail)
            .HasMaxLength(150);

        builder.Property(x => x.ShippingName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.ShippingPhone)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.ShippingAddress)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.ShippingCity)
            .HasMaxLength(100);

        builder.Property(x => x.ShippingArea)
            .HasMaxLength(100);

        builder.Property(x => x.ShippingPostalCode)
            .HasMaxLength(20);

        builder.Property(x => x.CustomerNote)
            .HasMaxLength(500);

        // Registered customer is optional.
        // Guest checkout is allowed.
        builder.HasOne(x => x.Customer)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}