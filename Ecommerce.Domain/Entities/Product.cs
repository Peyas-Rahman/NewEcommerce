using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string SKU { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }

    public decimal Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    public string? Warranty { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsBestSeller { get; set; }

    public bool IsNewArrival { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }


    // Category
    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;


    // Brand
    public int? BrandId { get; set; }

    public Brand? Brand { get; set; }


    // Navigation Properties
    public ICollection<ProductImage> Images { get; set; }
        = new List<ProductImage>();

    public ICollection<ProductVariant> Variants { get; set; }
        = new List<ProductVariant>();
}