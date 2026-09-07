using Ecommerce.Application.DTOs.FlashSales;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/flash-sales")]
public class FlashSalesController : ControllerBase
{
    private readonly IFlashSaleService _service;

    public FlashSalesController(IFlashSaleService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false) =>
        Ok(await _service.GetAllAsync(activeOnly));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sale = await _service.GetByIdAsync(id);
        return sale is null ? NotFound() : Ok(sale);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateFlashSaleDto dto)
    {
        try
        {
            var sale = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CreateFlashSaleDto dto)
    {
        try
        {
            var sale = await _service.UpdateAsync(id, dto);
            return sale is null ? NotFound() : Ok(sale);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await _service.DeleteAsync(id) ? NoContent() : NotFound();
}
