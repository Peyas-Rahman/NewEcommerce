using Ecommerce.Application.DTOs.Checkout;
using Ecommerce.Application.DTOs.Order;

namespace Ecommerce.Application.Interfaces.Services;

public interface ICheckoutService
{
    Task<OrderDto> CheckoutAsync(
        CheckoutDto dto);
}