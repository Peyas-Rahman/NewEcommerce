namespace Ecommerce.Application.DTOs.ProductVariants;

public class ProductVariantDto
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string SKU { get; set; } = string.Empty;

    public decimal? Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    public bool TrackInventory { get; set; }
    public bool IsActive { get; set; }

    public int SortOrder { get; set; }
}