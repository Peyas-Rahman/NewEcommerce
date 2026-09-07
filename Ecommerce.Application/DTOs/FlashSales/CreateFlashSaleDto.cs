namespace Ecommerce.Application.DTOs.FlashSales;

public class CreateFlashSaleDto
{
    public int ProductId { get; set; }
    public decimal SalePrice { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
