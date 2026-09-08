namespace Ecommerce.Domain.Entities;

public class ProductQuestion : BaseEntity
{
    public int ProductId { get; set; }
    public int CustomerId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Answer { get; set; }
    public DateTime? AnsweredAt { get; set; }
    public bool IsApproved { get; set; } = true;

    public Product Product { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
}
