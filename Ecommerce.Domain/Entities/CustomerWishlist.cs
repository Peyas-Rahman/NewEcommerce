namespace Ecommerce.Domain.Entities;

public class CustomerWishlist : BaseEntity
{
    public int CustomerId { get; set; }

    public int ProductId { get; set; }

    public Customer Customer { get; set; } = null!;

    public Product Product { get; set; } = null!;
}