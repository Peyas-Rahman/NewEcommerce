namespace Ecommerce.Domain.Entities;

public class Cart : BaseEntity
{
    // Registered customer-এর জন্য
    public int? CustomerId { get; set; }

    // Guest cart-এর জন্য browser/device identifier
    public string? GuestToken { get; set; }

    public bool IsActive { get; set; } = true;

    public Customer? Customer { get; set; }

    public ICollection<CartItem> Items { get; set; }
        = new List<CartItem>();
}