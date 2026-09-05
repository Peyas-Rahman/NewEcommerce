namespace Ecommerce.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;

    // Nullable because guest checkout is allowed
    public int? CustomerId { get; set; }

    // Guest checkout information
    public string? GuestName { get; set; }

    public string? GuestPhone { get; set; }

    public string? GuestEmail { get; set; }

    // Amounts
    public decimal SubTotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal ShippingAmount { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal GrandTotal { get; set; }

    // Order status
    public string OrderStatus { get; set; }
        = "Pending";

    public string PaymentStatus { get; set; }
        = "Pending";

    public string PaymentMethod { get; set; }
        = string.Empty;

    // Shipping
    public string ShippingName { get; set; }
        = string.Empty;

    public string ShippingPhone { get; set; }
        = string.Empty;

    public string ShippingAddress { get; set; }
        = string.Empty;

    public string? ShippingCity { get; set; }

    public string? ShippingArea { get; set; }

    public string? ShippingPostalCode { get; set; }

    public string? CustomerNote { get; set; }

    // Navigation
    public Customer? Customer { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; }
        = new List<OrderItem>();

    public ICollection<OrderStatusHistory> StatusHistory { get; set; }
        = new List<OrderStatusHistory>();
}