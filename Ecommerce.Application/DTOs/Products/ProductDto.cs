using Ecommerce.Application.DTOs.ProductImages;

namespace Ecommerce.Application.DTOs.Products;

public class ProductDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string SKU { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    public string? Warranty { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsBestSeller { get; set; }

    public bool IsNewArrival { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public int? BrandId { get; set; }

    public string? BrandName { get; set; }

    public IReadOnlyList<ProductImageDto> Images { get; set; } =
        Array.Empty<ProductImageDto>();
}