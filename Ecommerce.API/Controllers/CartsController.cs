using Ecommerce.Application.DTOs.Cart;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/carts")]
public class CartsController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartsController(
        ICartService cartService)
    {
        _cartService = cartService;
    }

    // =========================================================
    // GET CART
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetCart(
        [FromQuery] int? customerId = null,
        [FromQuery] string? guestToken = null)
    {
        try
        {
            var cart =
                await _cartService.GetOrCreateCartAsync(
                    customerId,
                    guestToken);

            return Ok(cart);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // ADD ITEM
    // =========================================================

    [HttpPost("items")]
    public async Task<IActionResult> AddItem(
        [FromQuery] int? customerId,
        [FromQuery] string? guestToken,
        [FromBody] AddToCartDto dto)
    {
        try
        {
            var cart =
                await _cartService.AddItemAsync(
                    customerId,
                    guestToken,
                    dto);

            return Ok(cart);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // UPDATE ITEM
    // =========================================================

    [HttpPut("{cartId:int}/items/{cartItemId:int}")]
    public async Task<IActionResult> UpdateItem(
        int cartId,
        int cartItemId,
        [FromBody] UpdateCartItemDto dto)
    {
        try
        {
            var cart =
                await _cartService.UpdateItemAsync(
                    cartId,
                    cartItemId,
                    dto);

            if (cart is null)
            {
                return NotFound(new
                {
                    message = "Cart item not found."
                });
            }

            return Ok(cart);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // REMOVE ITEM
    // =========================================================

    [HttpDelete("{cartId:int}/items/{cartItemId:int}")]
    public async Task<IActionResult> RemoveItem(
        int cartId,
        int cartItemId)
    {
        var removed =
            await _cartService.RemoveItemAsync(
                cartId,
                cartItemId);

        if (!removed)
        {
            return NotFound(new
            {
                message = "Cart item not found."
            });
        }

        return Ok(new
        {
            message = "Cart item removed successfully."
        });
    }

    // =========================================================
    // CLEAR CART
    // =========================================================

    [HttpDelete("{cartId:int}")]
    public async Task<IActionResult> ClearCart(
        int cartId)
    {
        var cleared =
            await _cartService.ClearCartAsync(
                cartId);

        if (!cleared)
        {
            return NotFound(new
            {
                message = "Cart not found."
            });
        }

        return Ok(new
        {
            message = "Cart cleared successfully."
        });
    }



    // =========================================================
    // MERGE GUEST CART
    // =========================================================

    [Authorize]
    [HttpPost("merge")]
    public async Task<IActionResult> MergeGuestCart(
        [FromQuery] string guestToken)
    {
        try
        {
            var customerIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                customerIdValue,
                out var customerId))
            {
                return Unauthorized(new
                {
                    message =
                        "Customer identity not found."
                });
            }

            if (string.IsNullOrWhiteSpace(guestToken))
            {
                return BadRequest(new
                {
                    message =
                        "Guest token is required."
                });
            }

            var result =
                await _cartService.MergeGuestCartAsync(
                    customerId,
                    guestToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

}