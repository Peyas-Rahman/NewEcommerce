using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class InventoryTransactionConfiguration
    : IEntityTypeConfiguration<InventoryTransaction>
{
    public void Configure(
        EntityTypeBuilder<InventoryTransaction> builder)
    {
        builder
            .HasKey(x => x.Id);

        builder
            .Property(x => x.TransactionType)
            .HasMaxLength(50)
            .IsRequired();

        builder
            .Property(x => x.ReferenceType)
            .HasMaxLength(50);

        builder
            .Property(x => x.ReferenceId)
            .HasMaxLength(100);

        builder
            .Property(x => x.Note)
            .HasMaxLength(500);

        builder
            .HasOne(x => x.Inventory)
            .WithMany()
            .HasForeignKey(x => x.InventoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}