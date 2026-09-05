namespace Ecommerce.Domain.Entities;

public class OrderStatusHistory : BaseEntity
{
    public int OrderId { get; set; }

    public string Status { get; set; }
        = string.Empty;

    public string? Note { get; set; }

    public Order Order { get; set; } = null!;
}