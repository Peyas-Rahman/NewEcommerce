namespace Ecommerce.Application.DTOs.ProductVariants;

public class CreateProductVariantDto
{
    public string Name { get; set; } = string.Empty;

    public string? SKU { get; set; }

    public decimal? Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    public bool TrackInventory { get; set; } = false;
    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}