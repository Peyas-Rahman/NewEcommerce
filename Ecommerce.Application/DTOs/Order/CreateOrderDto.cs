namespace Ecommerce.Application.DTOs.Order;

public class CreateOrderDto
{
    // Optional - null means Guest Checkout
    public int? CustomerId { get; set; }

    // Guest customer information
    public string? GuestName { get; set; }

    public string? GuestPhone { get; set; }

    public string? GuestEmail { get; set; }

    // Shipping information
    public string ShippingName { get; set; }
        = string.Empty;

    public string ShippingPhone { get; set; }
        = string.Empty;

    public string ShippingAddress { get; set; }
        = string.Empty;

    public string? ShippingCity { get; set; }

    public string? ShippingArea { get; set; }

    public string? ShippingPostalCode { get; set; }

    public string PaymentMethod { get; set; }
        = string.Empty;

    public string? CustomerNote { get; set; }

    public string? CouponCode { get; set; }

    public List<CreateOrderItemDto> Items { get; set; }
        = new();
}