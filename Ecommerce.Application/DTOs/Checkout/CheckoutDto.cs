using Ecommerce.Application.DTOs.Order;

namespace Ecommerce.Application.DTOs.Checkout;

public class CheckoutDto
{
    // Guest হলে null থাকবে
    public int? CustomerId { get; set; }

    // Guest information
    public string? GuestName { get; set; }

    public string? GuestPhone { get; set; }

    public string? GuestEmail { get; set; }

    // Guest cart-এর জন্য
    public string? GuestToken { get; set; }

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

    // Payment
    public string PaymentMethod { get; set; }
        = string.Empty;

    public string? CustomerNote { get; set; }
}