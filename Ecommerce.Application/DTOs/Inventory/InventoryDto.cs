namespace Ecommerce.Application.DTOs.Inventory;

public class InventoryDto
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int? ProductVariantId { get; set; }

    public int StockQuantity { get; set; }

    public int ReservedQuantity { get; set; }

    public int AvailableQuantity { get; set; }

    public int ReorderLevel { get; set; }

    public bool IsActive { get; set; }
}