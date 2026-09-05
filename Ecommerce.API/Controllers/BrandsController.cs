using Ecommerce.Application.DTOs.Brands;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly IBrandService _brandService;

    public BrandsController(IBrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var brands = await _brandService.GetAllAsync();

        return Ok(brands);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var brand = await _brandService.GetByIdAsync(id);

        if (brand is null)
            return NotFound();

        return Ok(brand);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateBrandDto dto)
    {
        var brand = await _brandService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = brand.Id },
            brand);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateBrandDto dto)
    {
        var brand = await _brandService.UpdateAsync(id, dto);

        if (brand is null)
            return NotFound();

        return Ok(brand);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _brandService.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}