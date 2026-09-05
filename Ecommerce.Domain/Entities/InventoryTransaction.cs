namespace Ecommerce.Domain.Entities;

public class InventoryTransaction : BaseEntity
{
    public int InventoryId { get; set; }

    public int Quantity { get; set; }

    public int QuantityBefore { get; set; }

    public int QuantityAfter { get; set; }

    public string TransactionType { get; set; }
        = string.Empty;

    public string? ReferenceType { get; set; }

    public string? ReferenceId { get; set; }

    public string? Note { get; set; }

    // Navigation
    public Inventory Inventory { get; set; } = null!;
}