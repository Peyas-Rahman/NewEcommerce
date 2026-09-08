using Ecommerce.Application.DTOs.Coupons;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/coupons")]
public class CouponsController : ControllerBase
{
    private readonly ICouponService _service;
    public CouponsController(ICouponService service) => _service = service;

    [HttpPost("validate")]
    public async Task<IActionResult> Validate(CouponValidationDto dto)
    {
        try { return Ok(await _service.ValidateAsync(dto)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCouponDto dto)
    {
        try { return Ok(await _service.CreateAsync(dto)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
