namespace Ecommerce.Application.DTOs.Order;

public class CreateOrderItemDto
{
    public int ProductId { get; set; }

    public int? ProductVariantId { get; set; }

    public int Quantity { get; set; }
}