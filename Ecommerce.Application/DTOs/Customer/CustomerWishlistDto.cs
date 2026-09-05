namespace Ecommerce.Application.DTOs.Customer;

public class CustomerWishlistDto
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string ProductName { get; set; }
        = string.Empty;

    public string? ImageUrl { get; set; }

    public decimal Price { get; set; }

    public DateTime CreatedAt { get; set; }
}