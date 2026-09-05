namespace Ecommerce.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public int ProductId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string SKU { get; set; } = string.Empty;

    public decimal? Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    // Inventory tracking is optional
    public bool TrackInventory { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }

    // Navigation
    public Product Product { get; set; } = null!;

    public Inventory? Inventory { get; set; }
}