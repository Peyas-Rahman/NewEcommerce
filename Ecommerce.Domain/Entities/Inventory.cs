namespace Ecommerce.Domain.Entities;

public class Inventory : BaseEntity
{
    public int ProductId { get; set; }

    public int? ProductVariantId { get; set; }

    public int StockQuantity { get; set; }

    public int ReservedQuantity { get; set; }

    public int ReorderLevel { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public Product Product { get; set; } = null!;

    public ProductVariant? ProductVariant { get; set; }
}