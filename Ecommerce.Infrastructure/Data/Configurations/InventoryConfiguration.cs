using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class InventoryConfiguration
    : IEntityTypeConfiguration<Inventory>
{
    public void Configure(
        EntityTypeBuilder<Inventory> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x =>
            x.StockQuantity)
            .IsRequired();

        builder.Property(x =>
            x.ReservedQuantity)
            .IsRequired();

        builder.Property(x =>
            x.ReorderLevel)
            .IsRequired();

        builder.Property(x =>
            x.IsActive)
            .IsRequired();

        // Product → Inventory
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // ProductVariant → Inventory
        builder.HasOne(x => x.ProductVariant)
            .WithOne(x => x.Inventory)
            .HasForeignKey<Inventory>(
                x => x.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);

        // One Product can have only one
        // Product-level inventory
        builder.HasIndex(x => new
        {
            x.ProductId,
            x.ProductVariantId
        });
    }
}