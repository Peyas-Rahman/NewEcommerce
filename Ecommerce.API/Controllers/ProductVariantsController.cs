using Ecommerce.Application.DTOs.ProductVariants;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/products/{productId:int}/variants")]
public class ProductVariantsController : ControllerBase
{
    private readonly IProductVariantService _variantService;

    public ProductVariantsController(
        IProductVariantService variantService)
    {
        _variantService = variantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetByProductId(
        int productId)
    {
        var variants =
            await _variantService.GetByProductIdAsync(productId);

        return Ok(variants);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int productId,
        int id)
    {
        var variant =
            await _variantService.GetByIdAsync(id);

        if (variant is null ||
            variant.ProductId != productId)
        {
            return NotFound();
        }

        return Ok(variant);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        int productId,
        CreateProductVariantDto dto)
    {
        try
        {
            var variant =
                await _variantService.CreateAsync(
                    productId,
                    dto);

            if (variant is null)
            {
                return NotFound(new
                {
                    message = "Product not found."
                });
            }

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    productId,
                    id = variant.Id
                },
                variant);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int productId,
        int id,
        UpdateProductVariantDto dto)
    {
        try
        {
            var existingVariant =
                await _variantService.GetByIdAsync(id);

            if (existingVariant is null ||
                existingVariant.ProductId != productId)
            {
                return NotFound();
            }

            var variant =
                await _variantService.UpdateAsync(
                    id,
                    dto);

            if (variant is null)
                return NotFound();

            return Ok(variant);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int productId,
        int id)
    {
        var existingVariant =
            await _variantService.GetByIdAsync(id);

        if (existingVariant is null ||
            existingVariant.ProductId != productId)
        {
            return NotFound();
        }

        var deleted =
            await _variantService.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}