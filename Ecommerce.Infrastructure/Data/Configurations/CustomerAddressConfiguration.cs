using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class CustomerAddressConfiguration
    : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(
        EntityTypeBuilder<CustomerAddress> builder)
    {
        // =====================================================
        // TABLE NAME
        // =====================================================

        builder.ToTable("CustomerAddress");

        // =====================================================
        // PRIMARY KEY
        // =====================================================

        builder.HasKey(x => x.Id);

        // =====================================================
        // CUSTOMER RELATIONSHIP
        // =====================================================

        builder.HasOne(x => x.Customer)
            .WithMany(x => x.Addresses)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        // =====================================================
        // ADDRESS TYPE
        // =====================================================

        builder.Property(x => x.AddressType)
            .HasMaxLength(30)
            .IsRequired();

        // =====================================================
        // FULL NAME
        // =====================================================

        builder.Property(x => x.FullName)
            .HasMaxLength(150)
            .IsRequired();

        // =====================================================
        // PHONE
        // =====================================================

        builder.Property(x => x.Phone)
            .HasMaxLength(20)
            .IsRequired();

        // =====================================================
        // ADDRESS LINE
        // =====================================================

        builder.Property(x => x.AddressLine)
            .HasMaxLength(500)
            .IsRequired();

        // =====================================================
        // CITY
        // =====================================================

        builder.Property(x => x.City)
            .HasMaxLength(100);

        // =====================================================
        // AREA
        // =====================================================

        builder.Property(x => x.Area)
            .HasMaxLength(100);

        // =====================================================
        // POSTAL CODE
        // =====================================================

        builder.Property(x => x.PostalCode)
            .HasMaxLength(20);

        // =====================================================
        // DEFAULT ADDRESS
        // =====================================================

        builder.Property(x => x.IsDefault)
            .IsRequired();

        // =====================================================
        // INDEXES
        // =====================================================

        builder.HasIndex(x => x.CustomerId);

        builder.HasIndex(x => new
        {
            x.CustomerId,
            x.IsDefault
        });
    }
}