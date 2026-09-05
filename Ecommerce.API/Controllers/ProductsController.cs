using Ecommerce.Application.DTOs.Products;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(
        IProductService productService)
    {
        _productService = productService;
    }

    // =========================================================
    // GET ALL PRODUCTS
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products =
            await _productService.GetAllAsync();

        return Ok(products);
    }

    // =========================================================
    // SEARCH / FILTER / SORT / PAGINATION
    // =========================================================

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] ProductQueryDto query)
    {
        var result =
            await _productService.SearchAsync(query);

        return Ok(result);
    }

    // =========================================================
    // GET PRODUCT BY ID
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id)
    {
        var product =
            await _productService.GetByIdAsync(id);

        if (product is null)
        {
            return NotFound(new
            {
                message =
                    "Product not found."
            });
        }

        return Ok(product);
    }

    // =========================================================
    // CREATE PRODUCT
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductDto dto)
    {
        try
        {
            var product =
                await _productService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = product.Id
                },
                product);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message =
                    ex.Message
            });
        }
    }

    // =========================================================
    // UPDATE PRODUCT
    // =========================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateProductDto dto)
    {
        try
        {
            var product =
                await _productService.UpdateAsync(
                    id,
                    dto);

            if (product is null)
            {
                return NotFound(new
                {
                    message =
                        "Product not found."
                });
            }

            return Ok(product);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message =
                    ex.Message
            });
        }
    }

    // =========================================================
    // DELETE PRODUCT
    // =========================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id)
    {
        var deleted =
            await _productService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message =
                    "Product not found."
            });
        }

        return NoContent();
    }

    // =========================================================
    // GET PRODUCT DETAILS
    // =========================================================

    [HttpGet("{id:int}/details")]
    public async Task<IActionResult> GetDetails(
        int id)
    {
        var product =
            await _productService
                .GetDetailsAsync(id);

        if (product is null)
        {
            return NotFound(new
            {
                message =
                    "Product not found."
            });
        }

        return Ok(product);
    }

}