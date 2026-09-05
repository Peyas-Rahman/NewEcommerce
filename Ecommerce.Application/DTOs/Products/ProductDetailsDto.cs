using Ecommerce.Application.DTOs.ProductImages;
using Ecommerce.Application.DTOs.ProductVariants;

namespace Ecommerce.Application.DTOs.Products;

public class ProductDetailsDto
{
    // =========================================================
    // PRODUCT
    // =========================================================

    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string SKU { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    public decimal EffectivePrice =>
        DiscountPrice ?? Price;

    public decimal DiscountPercentage
    {
        get
        {
            if (!DiscountPrice.HasValue ||
                Price <= 0)
            {
                return 0;
            }

            return Math.Round(
                ((Price - DiscountPrice.Value) / Price) * 100,
                2);
        }
    }

    public string? Warranty { get; set; }

    // =========================================================
    // CATEGORY / BRAND
    // =========================================================

    public int CategoryId { get; set; }

    public string CategoryName { get; set; } =
        string.Empty;

    public int? BrandId { get; set; }

    public string? BrandName { get; set; }

    // =========================================================
    // PRODUCT STATUS
    // =========================================================

    public bool IsFeatured { get; set; }

    public bool IsBestSeller { get; set; }

    public bool IsNewArrival { get; set; }

    public bool IsActive { get; set; }

    // =========================================================
    // INVENTORY
    // =========================================================

    public int Stock { get; set; }

    public bool IsInStock { get; set; }

    // =========================================================
    // IMAGES
    // =========================================================

    public IReadOnlyList<ProductImageDto> Images { get; set; } =
        Array.Empty<ProductImageDto>();

    // =========================================================
    // VARIANTS
    // =========================================================

    public IReadOnlyList<ProductVariantDto> Variants { get; set; } =
        Array.Empty<ProductVariantDto>();
}