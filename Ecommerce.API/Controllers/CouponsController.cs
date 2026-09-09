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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CreateCouponDto dto)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (updated is null) return NotFound();
            return Ok(updated);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return Ok(new { message = "Coupon deleted successfully." });
    }
}
