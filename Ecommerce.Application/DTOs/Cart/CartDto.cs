namespace Ecommerce.Application.DTOs.Cart;

public class CartDto
{
    public int Id { get; set; }

    public int? CustomerId { get; set; }

    public string? GuestToken { get; set; }

    public int TotalItems { get; set; }

    public decimal SubTotal { get; set; }

    public List<CartItemDto> Items { get; set; }
        = new();
}