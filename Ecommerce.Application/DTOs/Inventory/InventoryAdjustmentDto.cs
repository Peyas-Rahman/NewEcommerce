namespace Ecommerce.Application.DTOs.Inventory;

public class InventoryAdjustmentDto
{
    public int Quantity { get; set; }

    public string TransactionType { get; set; }
        = string.Empty;

    public string? ReferenceType { get; set; }

    public string? ReferenceId { get; set; }

    public string? Note { get; set; }
}