using Ecommerce.Application.DTOs.Cart;

namespace Ecommerce.Application.Interfaces.Services;

public interface ICartService
{
    Task<CartDto> GetOrCreateCartAsync(
        int? customerId,
        string? guestToken);

    Task<CartDto> AddItemAsync(
        int? customerId,
        string? guestToken,
        AddToCartDto dto);

    Task<CartDto?> UpdateItemAsync(
        int cartId,
        int cartItemId,
        UpdateCartItemDto dto);

    Task<bool> RemoveItemAsync(
        int cartId,
        int cartItemId);

    Task<bool> ClearCartAsync(
        int cartId);

    Task<CartDto> MergeGuestCartAsync(
    int customerId,
    string guestToken);

}