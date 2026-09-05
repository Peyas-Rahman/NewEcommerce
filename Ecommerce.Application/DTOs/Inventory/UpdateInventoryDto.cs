namespace Ecommerce.Application.DTOs.Inventory;

public class UpdateInventoryDto
{
    public int StockQuantity { get; set; }

    public int ReservedQuantity { get; set; }

    public int ReorderLevel { get; set; }

    public bool IsActive { get; set; }
}