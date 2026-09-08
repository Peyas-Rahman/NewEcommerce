using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Data.Configurations;

public class ProductQuestionConfiguration : IEntityTypeConfiguration<ProductQuestion>
{
    public void Configure(EntityTypeBuilder<ProductQuestion> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Question).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.Answer).HasMaxLength(2000);
        builder.HasIndex(x => x.ProductId);
        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
    }
}
