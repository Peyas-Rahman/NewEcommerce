namespace Ecommerce.Application.DTOs.FlashSales;

public class FlashSaleDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal SalePrice { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}
