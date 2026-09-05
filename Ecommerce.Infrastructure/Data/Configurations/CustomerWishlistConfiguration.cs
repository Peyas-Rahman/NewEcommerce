using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class CustomerWishlistConfiguration
    : IEntityTypeConfiguration<CustomerWishlist>
{
    public void Configure(
        EntityTypeBuilder<CustomerWishlist> builder)
    {
        // =====================================================
        // TABLE
        // =====================================================

        builder.ToTable("CustomerWishlist");

        // =====================================================
        // PRIMARY KEY
        // =====================================================

        builder.HasKey(x => x.Id);

        // =====================================================
        // CUSTOMER RELATIONSHIP
        // =====================================================

        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        // =====================================================
        // PRODUCT RELATIONSHIP
        // =====================================================

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // =====================================================
        // UNIQUE CUSTOMER + PRODUCT
        // Prevent duplicate wishlist items
        // =====================================================

        builder.HasIndex(x => new
        {
            x.CustomerId,
            x.ProductId
        })
        .IsUnique();

        // =====================================================
        // CUSTOMER INDEX
        // Fast customer wishlist lookup
        // =====================================================

        builder.HasIndex(x => x.CustomerId);

        // =====================================================
        // PRODUCT INDEX
        // Fast product wishlist lookup
        // =====================================================

        builder.HasIndex(x => x.ProductId);
    }
}