namespace Ecommerce.Application.DTOs.ProductVariants;

public class UpdateProductVariantDto
{
    public string Name { get; set; } = string.Empty;

    public string? SKU { get; set; }

    public decimal? Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    public bool TrackInventory { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }
}