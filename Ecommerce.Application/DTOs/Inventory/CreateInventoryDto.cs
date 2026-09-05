namespace Ecommerce.Application.DTOs.Inventory;

public class CreateInventoryDto
{
    public int StockQuantity { get; set; }

    public int ReservedQuantity { get; set; }

    public int ReorderLevel { get; set; }

    public bool IsActive { get; set; } = true;
}