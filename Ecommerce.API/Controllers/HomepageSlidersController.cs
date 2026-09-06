using Ecommerce.Application.DTOs.HomepageSliders;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/homepage-sliders")]
public class HomepageSlidersController : ControllerBase
{
    private readonly IHomepageSliderService _service;
    public HomepageSlidersController(IHomepageSliderService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false) => Ok(await _service.GetAllAsync(activeOnly));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var slider = await _service.GetByIdAsync(id);
        return slider is null ? NotFound() : Ok(slider);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateHomepageSliderDto dto)
    {
        try { var slider = await _service.CreateAsync(dto); return CreatedAtAction(nameof(GetById), new { id = slider.Id }, slider); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CreateHomepageSliderDto dto)
    {
        try { var slider = await _service.UpdateAsync(id, dto); return slider is null ? NotFound() : Ok(slider); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await _service.DeleteAsync(id) ? NoContent() : NotFound();
}
