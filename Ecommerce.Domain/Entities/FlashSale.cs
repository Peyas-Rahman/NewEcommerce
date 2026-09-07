namespace Ecommerce.Domain.Entities;

public class FlashSale : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal SalePrice { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
