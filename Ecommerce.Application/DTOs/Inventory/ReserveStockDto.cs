namespace Ecommerce.Application.DTOs.Inventory;

public class ReserveStockDto
{
    public int Quantity { get; set; }

    public string? ReferenceType { get; set; }

    public string? ReferenceId { get; set; }

    public string? Note { get; set; }
}