namespace Ecommerce.Domain.Entities;

public class ProductReview : BaseEntity
{
    public int ProductId { get; set; }
    public int CustomerId { get; set; }
    public int Rating { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = true;

    public Product Product { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
}
