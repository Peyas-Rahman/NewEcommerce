namespace Ecommerce.Application.DTOs.Order;

public class OrderDto
{
    public int Id { get; set; }

    public string OrderNumber { get; set; }
        = string.Empty;

    public int? CustomerId { get; set; }

    public string? GuestName { get; set; }

    public string? GuestPhone { get; set; }

    public string? GuestEmail { get; set; }

    public decimal SubTotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal ShippingAmount { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal GrandTotal { get; set; }

    public string OrderStatus { get; set; }
        = string.Empty;

    public string PaymentStatus { get; set; }
        = string.Empty;

    public string PaymentMethod { get; set; }
        = string.Empty;

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

    public DateTime CreatedAt { get; set; }

    public List<OrderItemDto> Items { get; set; }
        = new();
}