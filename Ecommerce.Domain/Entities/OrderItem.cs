namespace Ecommerce.Domain.Entities;

public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int? ProductVariantId { get; set; }

    // Product snapshot
    public string ProductName { get; set; }
        = string.Empty;

    public string? VariantName { get; set; }

    public string SKU { get; set; }
        = string.Empty;

    // Price snapshot at order time
    public decimal UnitPrice { get; set; }

    public decimal DiscountAmount { get; set; }

    public int Quantity { get; set; }

    public decimal TotalPrice { get; set; }

    // Navigation
    public Order Order { get; set; } = null!;

    public Product Product { get; set; } = null!;

    public ProductVariant? ProductVariant { get; set; }
}