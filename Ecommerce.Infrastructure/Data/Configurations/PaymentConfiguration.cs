using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class PaymentConfiguration :
    IEntityTypeConfiguration<Payment>
{
    public void Configure(
        EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.PaymentMethod)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.PaymentStatus)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(x => x.Amount)
            .HasPrecision(18, 2);

        builder.Property(x => x.TransactionId)
            .HasMaxLength(200);

        builder.Property(x => x.PaymentGateway)
            .HasMaxLength(100);

        builder.Property(x => x.FailureReason)
            .HasMaxLength(500);

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        // Order → Payments
        builder.HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.OrderId);

        builder.HasIndex(x => x.TransactionId);

        builder.HasIndex(x => x.PaymentStatus);
    }
}