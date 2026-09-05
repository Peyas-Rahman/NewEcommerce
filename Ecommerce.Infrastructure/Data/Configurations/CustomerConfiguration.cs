using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class CustomerConfiguration
    : IEntityTypeConfiguration<Customer>
{
    public void Configure(
        EntityTypeBuilder<Customer> builder)
    {
        // =====================================================
        // Primary Key
        // =====================================================

        builder.HasKey(x => x.Id);

        // =====================================================
        // First Name
        // =====================================================

        builder.Property(x => x.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        // =====================================================
        // Last Name
        // =====================================================

        builder.Property(x => x.LastName)
            .HasMaxLength(100);

        // =====================================================
        // Phone
        // Optional - Customer can register with Email
        // =====================================================

        builder.Property(x => x.Phone)
            .HasMaxLength(20);

        // =====================================================
        // Email
        // Optional - Customer can register with Phone
        // =====================================================

        builder.Property(x => x.Email)
            .HasMaxLength(150);

        // =====================================================
        // Password Hash
        // =====================================================

        builder.Property(x => x.PasswordHash)
            .HasMaxLength(500);

        // =====================================================
        // Account Status
        // =====================================================

        builder.Property(x => x.IsActive)
            .IsRequired();

        // =====================================================
        // Unique Email
        // Only active/non-deleted customers
        // =====================================================

        builder.HasIndex(x => x.Email)
            .IsUnique()
            .HasFilter(
                "[Email] IS NOT NULL AND [IsDeleted] = 0");

        // =====================================================
        // Unique Phone
        // Only active/non-deleted customers
        // =====================================================

        builder.HasIndex(x => x.Phone)
            .IsUnique()
            .HasFilter(
                "[Phone] IS NOT NULL AND [IsDeleted] = 0");
    }
}