using Ecommerce.Application.DTOs.Customer;

namespace Ecommerce.Application.Interfaces.Services;

public interface ICustomerWishlistService
{
    Task<IReadOnlyList<CustomerWishlistDto>>
        GetMyWishlistAsync(
            int customerId);

    Task<CustomerWishlistDto?>
        AddAsync(
            int customerId,
            int productId);

    Task<bool>
        RemoveAsync(
            int customerId,
            int productId);
}