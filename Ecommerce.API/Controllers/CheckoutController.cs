using Ecommerce.Application.DTOs.Checkout;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/checkout")]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _checkoutService;

    public CheckoutController(
        ICheckoutService checkoutService)
    {
        _checkoutService = checkoutService;
    }

    [HttpPost]
    public async Task<IActionResult> Checkout(
        [FromBody] CheckoutDto dto)
    {
        try
        {
            var order =
                await _checkoutService.CheckoutAsync(dto);

            return Ok(order);
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